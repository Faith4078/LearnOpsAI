import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchKnowledgeOpsStats } from "@/actions/fetch-stats";
import {
  calculateAverageProcessingTime,
  calculateAverageReviewScore,
  calculateKnowledgeBaseFreshness,
  computeKnowledgeOpsStats,
  countAiReviewsCompleted,
  getLastPublishedDate,
} from "@/lib/education/stats";
import { setSanityReader } from "@/lib/sanity";
import type { HelpArticleSummary, SanityReader } from "@/lib/sanity";

/**
 * Tests for the Knowledge Operations figures: the pure derivation
 * utilities directly, plus `fetchKnowledgeOpsStats` end-to-end with Sanity
 * faked at its single injection point (`setSanityReader`). No network
 * access anywhere in this file.
 */

// Fixed "now" so freshness-derived figures are deterministic.
const now = new Date("2026-07-09T00:00:00.000Z");

function summary(overrides: Partial<HelpArticleSummary>): HelpArticleSummary {
  return {
    title: "Getting Started",
    slug: "getting-started",
    summary: "Learn the basics.",
    publishedAt: "2026-07-09T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReader(summaries: HelpArticleSummary[]): SanityReader {
  return {
    fetchArticleSummaries: async () => summaries,
    fetchArticleBySlug: async () => null,
  };
}

afterEach(() => {
  setSanityReader(null);
  vi.unstubAllEnvs();
});

describe("stats derivations", () => {
  it("averages only the review scores that exist", () => {
    const summaries = [
      summary({ reviewScore: 80 }),
      summary({ reviewScore: 91 }),
      summary({}), // pre-governance: no score, excluded from the average
    ];

    expect(calculateAverageReviewScore(summaries)).toBe(86); // round((80+91)/2)
    expect(calculateAverageReviewScore([])).toBeNull();
  });

  it("averages only the processing times that exist", () => {
    const summaries = [
      summary({ processingSeconds: 40 }),
      summary({ processingSeconds: 44 }),
      summary({}), // no recorded time, excluded
    ];

    expect(calculateAverageProcessingTime(summaries)).toBe(42);
    expect(calculateAverageProcessingTime([])).toBeNull();
  });

  it("counts completed reviews as the assets carrying review metadata", () => {
    const summaries = [
      summary({ reviewScore: 80 }),
      summary({ reviewScore: 91 }),
      summary({}), // pre-governance document — no review recorded
    ];

    expect(countAiReviewsCompleted(summaries)).toBe(2);
  });

  it("derives knowledge base freshness as a health badge and percentage", () => {
    // Both published on `now` → freshness 100 → Healthy.
    const summaries = [summary({}), summary({ slug: "b" })];

    expect(calculateKnowledgeBaseFreshness(summaries, now)).toEqual({
      badge: { label: "Healthy", tone: "success" },
      percent: 100,
    });
    expect(calculateKnowledgeBaseFreshness([], now)).toBeNull();
  });

  it("picks the most recent publish date", () => {
    const summaries = [
      summary({ slug: "a", publishedAt: "2026-07-01T10:00:00.000Z" }),
      summary({ slug: "b", publishedAt: "2026-07-03T10:00:00.000Z" }),
    ];

    expect(getLastPublishedDate(summaries)).toBe("2026-07-03T10:00:00.000Z");
    expect(getLastPublishedDate([])).toBeNull();
  });

  it("assembles the full stats shape from the dataset", () => {
    const stats = computeKnowledgeOpsStats(
      [
        summary({ slug: "a", reviewScore: 80, processingSeconds: 40 }),
        summary({ slug: "b", reviewScore: 91, processingSeconds: 44 }),
      ],
      now,
    );

    expect(stats.publishedCount).toBe(2);
    expect(stats.aiGenerations).toBe(2);
    expect(stats.aiReviewsCompleted).toBe(2);
    expect(stats.averageReviewScore).toBe(86);
    expect(stats.averageProcessingSeconds).toBe(42);
    expect(stats.knowledgeBaseFreshness?.badge.label).toBe("Healthy");
    expect(stats.knowledgeBaseFreshness?.percent).toBe(100);
    expect(stats.lastPublishedAt).toBe("2026-07-09T00:00:00.000Z");
  });
});

describe("fetchKnowledgeOpsStats", () => {
  it("computes live figures from the published documents", async () => {
    setSanityReader(
      fakeReader([
        summary({
          slug: "a",
          publishedAt: "2026-07-01T10:00:00.000Z",
          reviewScore: 80,
          processingSeconds: 40,
        }),
        summary({
          slug: "b",
          publishedAt: "2026-07-03T10:00:00.000Z",
          reviewScore: 91,
          processingSeconds: 44,
        }),
        summary({
          slug: "c",
          publishedAt: "2026-06-20T10:00:00.000Z",
          // Pre-governance document: no review metadata. It still counts as
          // published (and generated) but is excluded from the averages.
        }),
      ]),
    );

    const result = await fetchKnowledgeOpsStats();

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.stats.publishedCount).toBe(3);
    expect(result.stats.aiGenerations).toBe(3);
    expect(result.stats.aiReviewsCompleted).toBe(2);
    expect(result.stats.averageReviewScore).toBe(86); // round((80+91)/2)
    expect(result.stats.averageProcessingSeconds).toBe(42); // round((40+44)/2)
    expect(result.stats.lastPublishedAt).toBe("2026-07-03T10:00:00.000Z");
    expect(result.stats.knowledgeBaseFreshness).not.toBeNull();
  });

  it("returns null derived figures for an empty knowledge base", async () => {
    setSanityReader(fakeReader([]));

    const result = await fetchKnowledgeOpsStats();

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.stats.publishedCount).toBe(0);
    expect(result.stats.aiGenerations).toBe(0);
    expect(result.stats.aiReviewsCompleted).toBe(0);
    expect(result.stats.averageReviewScore).toBeNull();
    expect(result.stats.averageProcessingSeconds).toBeNull();
    expect(result.stats.knowledgeBaseFreshness).toBeNull();
    expect(result.stats.lastPublishedAt).toBeNull();
  });

  it("maps a Sanity read failure to a sanity-error result", async () => {
    setSanityReader({
      fetchArticleSummaries: async () => {
        throw new Error("boom");
      },
      fetchArticleBySlug: async () => null,
    });

    const result = await fetchKnowledgeOpsStats();

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("sanity-error");
      expect(result.message).not.toContain("boom");
    }
  });

  it("returns missing-config when Sanity env vars are absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "");

    const result = await fetchKnowledgeOpsStats();

    expect(result).toMatchObject({ status: "error", code: "missing-config" });
  });
});
