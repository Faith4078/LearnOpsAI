import { createClient } from "@sanity/client";

import type { HelpArticleDoc, SanityResult, SanityWriter } from "./types";

const SANITY_API_VERSION = "2025-02-19";

/**
 * Test seam: when set, `getSanityWriter` returns this writer instead of
 * the real Sanity client. This is the only place Sanity can be faked.
 */
let sanityWriterOverride: SanityWriter | null = null;

export function setSanityWriter(writer: SanityWriter | null): void {
  sanityWriterOverride = writer;
}

function createRealWriter(
  projectId: string,
  dataset: string,
  token: string,
): SanityWriter {
  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
  });

  return {
    fetchSlugsMatching: async (baseSlug) =>
      client.fetch<string[]>(
        `*[_type == "helpArticle" && slug.current match $pattern].slug.current`,
        { pattern: `${baseSlug}*` },
      ),
    createHelpArticle: async (doc: HelpArticleDoc) => {
      // Sanity array items need a stable _key for Studio editing.
      const created = await client.create({
        _type: "helpArticle",
        title: doc.title,
        slug: { _type: "slug", current: doc.slug },
        summary: doc.summary,
        article: doc.article,
        faqs: doc.faqs.map((faq, index) => ({
          _type: "faq",
          _key: `faq-${index}`,
          ...faq,
        })),
        quiz: doc.quiz.map((question, index) => ({
          _type: "quizQuestion",
          _key: `quiz-${index}`,
          ...question,
        })),
        publishedAt: doc.publishedAt,
      });
      return created._id;
    },
  };
}

/**
 * Single entry point to Sanity writes. Owns client initialization and
 * configuration checks; the write token stays server-side only. Returns
 * a typed result — a missing configuration never throws.
 */
export function getSanityWriter(): SanityResult<SanityWriter> {
  if (sanityWriterOverride !== null) {
    return { ok: true, data: sanityWriterOverride };
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  const missing = [
    ["NEXT_PUBLIC_SANITY_PROJECT_ID", projectId],
    ["NEXT_PUBLIC_SANITY_DATASET", dataset],
    ["SANITY_API_TOKEN", token],
  ]
    .filter(([, value]) => value === undefined || value.trim() === "")
    .map(([name]) => name);

  if (missing.length > 0 || !projectId || !dataset || !token) {
    return {
      ok: false,
      error: {
        code: "missing-config",
        message: `Sanity is not configured. Missing: ${missing.join(", ")} (see .env.example).`,
      },
    };
  }

  return { ok: true, data: createRealWriter(projectId, dataset, token) };
}
