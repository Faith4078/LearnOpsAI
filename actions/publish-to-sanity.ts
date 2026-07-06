"use server";

import { contentBundleSchema } from "@/lib/ai";
import { getSanityWriter } from "@/lib/sanity";
import type { ContentBundle, PublishContentResult } from "@/lib/types";
import { dedupeSlug, normalizeSlug } from "@/utils/slug";

const ERROR_MESSAGES = {
  "invalid-response":
    "The reviewed content is incomplete and cannot be published. Run the pipeline again.",
  "missing-config":
    "Publishing is not configured. Ask an administrator to set the Sanity environment variables.",
  "sanity-error":
    "The article could not be saved to the Help Center. Please try again in a moment.",
} as const;

/**
 * Publishes the reviewed bundle to Sanity as a `helpArticle` document.
 * Normalizes and de-duplicates the AI-generated slug before writing.
 * Never throws — Sanity failures surface as a typed `sanity-error`,
 * distinct from AI errors, so operators know which system failed.
 */
export async function publishToSanity(
  bundle: ContentBundle,
): Promise<PublishContentResult> {
  const parsed = contentBundleSchema.safeParse(bundle);
  if (!parsed.success) {
    return {
      status: "error",
      code: "invalid-response",
      message: ERROR_MESSAGES["invalid-response"],
    };
  }

  const writer = getSanityWriter();
  if (!writer.ok) {
    return {
      status: "error",
      code: writer.error.code,
      message: ERROR_MESSAGES[writer.error.code],
    };
  }

  const baseSlug = normalizeSlug(parsed.data.slug, parsed.data.title);
  try {
    const existing = await writer.data.fetchSlugsMatching(baseSlug);
    const slug = dedupeSlug(baseSlug, existing);
    await writer.data.createHelpArticle({
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      article: parsed.data.article,
      faqs: parsed.data.faqs,
      quiz: parsed.data.quiz,
      publishedAt: new Date().toISOString(),
    });
    return { status: "success", slug };
  } catch {
    return {
      status: "error",
      code: "sanity-error",
      message: ERROR_MESSAGES["sanity-error"],
    };
  }
}
