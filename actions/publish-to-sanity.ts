"use server";

import { revalidatePath } from "next/cache";

import {
  contentBundleSchema,
  GEMINI_MODEL,
  REVIEW_AGENT_VERSION,
  reviewReportSchema,
} from "@/lib/ai";
import { getSanityWriter } from "@/lib/sanity";
import type {
  ContentBundle,
  PublishContentResult,
  ReviewReport,
} from "@/lib/types";
import { dedupeSlug, normalizeSlug } from "@/utils/slug";

const ERROR_MESSAGES = {
  "invalid-response":
    "The reviewed knowledge asset is incomplete and cannot be published. Run the publishing workflow again.",
  "missing-config":
    "Publishing is not configured. Ask an administrator to set the Sanity environment variables.",
  "sanity-error":
    "The knowledge asset could not be saved to the knowledge base. Please try again in a moment.",
} as const;

/** Review outcome and provenance the publisher records as governance. */
export interface PublishReviewRecord {
  report: ReviewReport;
  /** Fingerprint/label of the source documentation for this run. */
  documentationVersion: string;
  /** Wall-clock seconds the AI pipeline (generate + review) took this run. */
  processingSeconds: number;
}

/**
 * Publishes the reviewed bundle to Sanity as a `helpArticle` document,
 * carrying its educational metadata and a governance record (review
 * score, recommendation, provenance). Normalizes and de-duplicates the
 * AI-generated slug before writing. Never throws — Sanity failures
 * surface as a typed `sanity-error`, distinct from AI errors, so
 * operators know which system failed.
 */
export async function publishToSanity(
  bundle: ContentBundle,
  review: PublishReviewRecord,
): Promise<PublishContentResult> {
  const parsed = contentBundleSchema.safeParse(bundle);
  const parsedReport = reviewReportSchema.safeParse(review?.report);
  if (
    !parsed.success ||
    !parsedReport.success ||
    typeof review.documentationVersion !== "string" ||
    review.documentationVersion.length === 0 ||
    typeof review.processingSeconds !== "number" ||
    !Number.isFinite(review.processingSeconds) ||
    review.processingSeconds < 0
  ) {
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
  const now = new Date().toISOString();
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
      educationalMetadata: parsed.data.educationalMetadata,
      governance: {
        reviewScore: parsedReport.data.overallQualityScore,
        publishingRecommendation: parsedReport.data.publishingRecommendation,
        generatedBy: GEMINI_MODEL,
        reviewAgentVersion: REVIEW_AGENT_VERSION,
        documentationVersion: review.documentationVersion,
        processingSeconds: Math.round(review.processingSeconds),
        lastReviewedAt: now,
      },
      publishedAt: now,
    });
    // Drop any client router cache for the surfaces that list this article
    // so it appears immediately after publishing, not on the next reload.
    revalidatePath("/help-center");
    revalidatePath(`/help-center/${slug}`);
    revalidatePath("/");
    return { status: "success", slug };
  } catch {
    return {
      status: "error",
      code: "sanity-error",
      message: ERROR_MESSAGES["sanity-error"],
    };
  }
}
