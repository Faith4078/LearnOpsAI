import { createClient } from "@sanity/client";

import { checkEnv } from "@/utils/env";

import type {
  HelpArticle,
  HelpArticleDoc,
  HelpArticleSummary,
  SanityReader,
  SanityResult,
  SanityWriter,
} from "./types";

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

  const env = checkEnv([
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "NEXT_PUBLIC_SANITY_DATASET",
    "SANITY_API_TOKEN",
  ]);
  if (!env.ok) {
    return {
      ok: false,
      error: {
        code: "missing-config",
        message: `Sanity is not configured. ${env.message}`,
      },
    };
  }

  return {
    ok: true,
    data: createRealWriter(
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
      process.env.NEXT_PUBLIC_SANITY_DATASET as string,
      process.env.SANITY_API_TOKEN as string,
    ),
  };
}

/**
 * Test seam: when set, `getSanityReader` returns this reader instead of
 * the real Sanity client. This is the only place Sanity reads can be faked.
 */
let sanityReaderOverride: SanityReader | null = null;

export function setSanityReader(reader: SanityReader | null): void {
  sanityReaderOverride = reader;
}

const SUMMARY_PROJECTION = `{
  title,
  "slug": slug.current,
  summary,
  publishedAt
}`;

const ARTICLE_PROJECTION = `{
  title,
  "slug": slug.current,
  summary,
  article,
  "faqs": coalesce(faqs[]{ question, answer }, []),
  "quiz": coalesce(quiz[]{ question, options, answer, explanation }, []),
  publishedAt
}`;

function createRealReader(projectId: string, dataset: string): SanityReader {
  // Read-only client: public dataset, no token, CDN is fine for reads.
  const client = createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: true,
  });

  return {
    fetchArticleSummaries: async () =>
      client.fetch<HelpArticleSummary[]>(
        `*[_type == "helpArticle" && defined(slug.current)] | order(publishedAt desc) ${SUMMARY_PROJECTION}`,
      ),
    fetchArticleBySlug: async (slug) =>
      client.fetch<HelpArticle | null>(
        `*[_type == "helpArticle" && slug.current == $slug][0] ${ARTICLE_PROJECTION}`,
        { slug },
      ),
  };
}

/**
 * Single entry point to Sanity reads. No token required — the Help Center
 * reads the public dataset. Returns a typed result — a missing
 * configuration never throws.
 */
export function getSanityReader(): SanityResult<SanityReader> {
  if (sanityReaderOverride !== null) {
    return { ok: true, data: sanityReaderOverride };
  }

  const env = checkEnv([
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "NEXT_PUBLIC_SANITY_DATASET",
  ]);
  if (!env.ok) {
    return {
      ok: false,
      error: {
        code: "missing-config",
        message: `Sanity is not configured. ${env.message}`,
      },
    };
  }

  return {
    ok: true,
    data: createRealReader(
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
      process.env.NEXT_PUBLIC_SANITY_DATASET as string,
    ),
  };
}
