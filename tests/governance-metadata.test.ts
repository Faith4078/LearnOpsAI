import { describe, expect, it } from "vitest";

import { buildGovernanceMetadata } from "@/lib/education/governance";
import type { ArticleGovernance } from "@/lib/sanity";

/**
 * Unit tests for the governance metadata builder — the seam the Content
 * Governance panel renders from (pattern established by the freshness and
 * quiz derivation modules). Timestamps use midday UTC so the formatted
 * dates are stable regardless of the runner's local timezone.
 */

const now = new Date("2026-07-09T12:00:00.000Z");
const PUBLISHED_AT = "2026-07-09T12:00:00.000Z";

const governance: ArticleGovernance = {
  reviewScore: 93,
  publishingRecommendation: "ready",
  generatedBy: "gemini-2.5-flash",
  reviewAgentVersion: "review-agent/v1",
  // Stores the source Markdown's name; the panel appends the version.
  documentationVersion: "Matter Search",
  processingSeconds: 42,
  lastReviewedAt: "2026-07-09T12:00:00.000Z",
};

describe("buildGovernanceMetadata", () => {
  it("maps a fully-governed asset to display-ready metadata", () => {
    const metadata = buildGovernanceMetadata(governance, PUBLISHED_AT, now);

    expect(metadata.status).toEqual({ label: "Published", tone: "success" });
    expect(metadata.reviewScore).toBe(93);
    expect(metadata.qualityRecommendation).toEqual({
      label: "Passed Quality Review",
      tone: "success",
    });
    expect(metadata.contentFreshness).toEqual({
      badge: { label: "Healthy", tone: "success" },
      percent: 100,
    });
    expect(metadata.documentationVersion).toBe("Matter Search v1");
    expect(metadata.reviewedBy).toEqual({
      role: "AI Quality Reviewer",
      poweredBy: "Powered by Gemini 2.5 Flash",
    });
    expect(metadata.publishedAt).toBe("July 9, 2026");
    expect(metadata.lastReviewedAt).toBe("July 9, 2026");
  });

  it("names the generator agent and its powering model", () => {
    const metadata = buildGovernanceMetadata(governance, PUBLISHED_AT, now);

    expect(metadata.generatedBy).toEqual({
      role: "Generator Agent",
      poweredBy: "Powered by Gemini 2.5 Flash",
    });
  });

  it("falls back to the raw model id for unknown models", () => {
    const metadata = buildGovernanceMetadata(
      { ...governance, generatedBy: "some-future-model" },
      PUBLISHED_AT,
      now,
    );

    expect(metadata.generatedBy?.poweredBy).toBe(
      "Powered by some-future-model",
    );
  });

  it("sets the next review due 90 days after the last review", () => {
    const metadata = buildGovernanceMetadata(governance, PUBLISHED_AT, now);

    expect(metadata.nextReviewDue).toBe("October 7, 2026");
  });

  it("flags a needs-attention recommendation as a warning", () => {
    const metadata = buildGovernanceMetadata(
      { ...governance, publishingRecommendation: "needs-attention" },
      PUBLISHED_AT,
      now,
    );

    expect(metadata.qualityRecommendation).toEqual({
      label: "Needs Attention",
      tone: "warning",
    });
  });

  it("degrades gracefully for pre-governance documents", () => {
    const metadata = buildGovernanceMetadata(null, PUBLISHED_AT, now);

    expect(metadata.status).toEqual({ label: "Published", tone: "success" });
    expect(metadata.reviewScore).toBeNull();
    expect(metadata.qualityRecommendation).toBeNull();
    expect(metadata.documentationVersion).toBeNull();
    expect(metadata.generatedBy).toBeNull();
    expect(metadata.reviewedBy).toBeNull();
    expect(metadata.lastReviewedAt).toBeNull();
    // Freshness and the next-review deadline still derive from publishedAt.
    expect(metadata.contentFreshness).not.toBeNull();
    expect(metadata.nextReviewDue).toBe("October 7, 2026");
    expect(metadata.publishedAt).toBe("July 9, 2026");
  });
});
