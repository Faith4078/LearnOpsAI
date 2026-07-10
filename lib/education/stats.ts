import { computeFreshness } from "@/lib/education/freshness";
import {
  freshnessHealth,
  type GovernanceFreshness,
} from "@/lib/education/governance";
import type { HelpArticleSummary } from "@/lib/sanity";

/**
 * Knowledge Operations Dashboard figures — every value derived from the
 * published article dataset, no placeholders. Recomputed on each request,
 * so publishing or deleting an article updates the dashboard automatically.
 */
export interface KnowledgeOpsStats {
  /** Total published Knowledge Assets currently stored in Sanity. */
  publishedCount: number;
  /** Successful Generator Agent runs — one per published asset. */
  aiGenerations: number;
  /** Successful Review Agent runs — assets carrying review metadata. */
  aiReviewsCompleted: number;
  /** Mean governance review score; null when no asset has one. */
  averageReviewScore: number | null;
  /** Mean AI processing seconds; null when none is recorded. */
  averageProcessingSeconds: number | null;
  /** Mean freshness across the base as a health badge; null when empty. */
  knowledgeBaseFreshness: GovernanceFreshness | null;
  /** Most recent publish date (ISO); null when nothing is published. */
  lastPublishedAt: string | null;
}

/** Rounded mean of the given numbers, or null when there are none. */
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Mean review score across the assets that carry one. */
export function calculateAverageReviewScore(
  summaries: HelpArticleSummary[],
): number | null {
  return average(
    summaries
      .map((summary) => summary.reviewScore)
      .filter((score): score is number => typeof score === "number"),
  );
}

/** Mean AI processing time (seconds) across the assets that recorded one. */
export function calculateAverageProcessingTime(
  summaries: HelpArticleSummary[],
): number | null {
  return average(
    summaries
      .map((summary) => summary.processingSeconds)
      .filter((seconds): seconds is number => typeof seconds === "number"),
  );
}

/** Number of assets carrying review metadata — i.e. completed AI reviews. */
export function countAiReviewsCompleted(
  summaries: HelpArticleSummary[],
): number {
  return summaries.filter((summary) => typeof summary.reviewScore === "number")
    .length;
}

/** Mean freshness across the base, as a health badge plus its percentage. */
export function calculateKnowledgeBaseFreshness(
  summaries: HelpArticleSummary[],
  now: Date = new Date(),
): GovernanceFreshness | null {
  const percent = average(
    summaries
      .map((summary) => computeFreshness({ publishedAt: summary.publishedAt }, now)?.score)
      .filter((score): score is number => typeof score === "number"),
  );
  if (percent === null) return null;
  return { badge: freshnessHealth(percent), percent };
}

/** Most recent publish date (ISO), or null when nothing is published. */
export function getLastPublishedDate(
  summaries: HelpArticleSummary[],
): string | null {
  const timestamps = summaries
    .map((summary) => Date.parse(summary.publishedAt))
    .filter((timestamp) => !Number.isNaN(timestamp));
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

/**
 * Assembles the dashboard's single data shape from the article summaries.
 * Pure and deterministic — the seam the fetch action and the dashboard
 * share. `now` is injectable so freshness is testable.
 */
export function computeKnowledgeOpsStats(
  summaries: HelpArticleSummary[],
  now: Date = new Date(),
): KnowledgeOpsStats {
  return {
    publishedCount: summaries.length,
    // Every published asset is the product of one successful generation.
    aiGenerations: summaries.length,
    aiReviewsCompleted: countAiReviewsCompleted(summaries),
    averageReviewScore: calculateAverageReviewScore(summaries),
    averageProcessingSeconds: calculateAverageProcessingTime(summaries),
    knowledgeBaseFreshness: calculateKnowledgeBaseFreshness(summaries, now),
    lastPublishedAt: getLastPublishedDate(summaries),
  };
}
