import {
  computeFreshness,
  freshnessLabel,
  type FreshnessLabel,
} from "@/lib/education/freshness";
import type { ArticleGovernance } from "@/lib/sanity";
import type { PublishingRecommendation } from "@/lib/types";
import { formatPublishedDate } from "@/utils/date";

/** Days between mandated reviews of a published Knowledge Asset. */
const REVIEW_CADENCE_DAYS = 90;

/** Semantic tone for a governance value; the UI maps this to color. */
export type GovernanceTone = "success" | "warning" | "danger" | "neutral";

/** A labelled pill (status, recommendation, freshness health). */
export interface GovernanceBadge {
  label: string;
  tone: GovernanceTone;
}

/** Provenance of one pipeline step — who produced or checked the asset. */
export interface GovernanceAgent {
  /** The operational role, e.g. "Generator Agent". */
  role: string;
  /** Optional model detail, e.g. "Powered by Gemini 2.5 Flash". */
  poweredBy?: string;
}

/** Freshness as an operational health badge plus its raw percentage. */
export interface GovernanceFreshness {
  badge: GovernanceBadge;
  percent: number;
}

/**
 * Display-ready governance metadata for the Content Governance panel.
 *
 * This is the seam between stored data and the UI. Today it is built from
 * a Sanity `ArticleGovernance` record, but the panel renders purely from
 * this shape, so the same values could later come from any CMS or API
 * without touching the UI. Fields legacy documents may lack are nullable,
 * and the panel skips them.
 */
export interface GovernanceMetadata {
  status: GovernanceBadge;
  reviewScore: number | null;
  qualityRecommendation: GovernanceBadge | null;
  contentFreshness: GovernanceFreshness | null;
  documentationVersion: string | null;
  generatedBy: GovernanceAgent | null;
  reviewedBy: GovernanceAgent | null;
  publishedAt: string;
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
}

const RECOMMENDATION_BADGES: Record<PublishingRecommendation, GovernanceBadge> =
  {
    ready: { label: "Passed Quality Review", tone: "success" },
    "needs-attention": { label: "Needs Attention", tone: "warning" },
  };

/** Maps freshness bands to the operational health wording operators expect. */
const FRESHNESS_HEALTH: Record<FreshnessLabel, GovernanceBadge> = {
  Fresh: { label: "Healthy", tone: "success" },
  Aging: { label: "Aging", tone: "warning" },
  Stale: { label: "Needs Review", tone: "danger" },
};

/**
 * The operational health badge for a freshness score (0-100) — the single
 * source of the Healthy/Aging/Needs-Review vocabulary shared by the article
 * governance panel and the Knowledge Operations dashboard.
 */
export function freshnessHealth(score: number): GovernanceBadge {
  return FRESHNESS_HEALTH[freshnessLabel(score)];
}

/** Friendly names for the models that back each agent. */
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

/** "Powered by <model>" detail for an agent, or undefined when unknown. */
function poweredByModel(modelId: string | undefined): string | undefined {
  if (!modelId) return undefined;
  return `Powered by ${MODEL_DISPLAY_NAMES[modelId] ?? modelId}`;
}

/** Documentation revisions aren't tracked yet, so every asset is v1. */
const DOCUMENTATION_VERSION = "v1";

/** The review-cadence deadline: `REVIEW_CADENCE_DAYS` after the last review. */
function computeNextReviewDue(
  lastReviewedAt: string | null,
  publishedAt: string,
): string | null {
  const timestamp = Date.parse(lastReviewedAt ?? publishedAt);
  if (Number.isNaN(timestamp)) return null;
  const due = new Date(timestamp + REVIEW_CADENCE_DAYS * 86_400_000);
  return formatPublishedDate(due.toISOString());
}

/**
 * Builds the display metadata the Content Governance panel renders from.
 * Pure and framework-free; `now` is injectable so freshness is testable.
 */
export function buildGovernanceMetadata(
  governance: ArticleGovernance | null | undefined,
  publishedAt: string,
  now: Date = new Date(),
): GovernanceMetadata {
  const lastReviewedAt = governance?.lastReviewedAt ?? null;
  const freshness = computeFreshness({ publishedAt, lastReviewedAt }, now);
  const recommendation = governance?.publishingRecommendation;

  return {
    status: { label: "Published", tone: "success" },
    reviewScore:
      typeof governance?.reviewScore === "number"
        ? governance.reviewScore
        : null,
    qualityRecommendation:
      recommendation !== undefined && recommendation in RECOMMENDATION_BADGES
        ? RECOMMENDATION_BADGES[recommendation]
        : null,
    contentFreshness: freshness
      ? { badge: FRESHNESS_HEALTH[freshness.label], percent: freshness.score }
      : null,
    // The stored value is the source Markdown's name; revisions aren't
    // tracked, so the version is always v1. Shown only for assets that
    // recorded documentation provenance.
    documentationVersion: governance?.documentationVersion
      ? `${governance.documentationVersion.trim()} ${DOCUMENTATION_VERSION}`
      : null,
    generatedBy: governance?.generatedBy
      ? {
          role: "Generator Agent",
          poweredBy: poweredByModel(governance.generatedBy),
        }
      : null,
    // The Review Agent runs on the same model as the generator, so its
    // powering model is the one recorded on the asset.
    reviewedBy: governance?.reviewAgentVersion
      ? {
          role: "AI Quality Reviewer",
          poweredBy: poweredByModel(governance?.generatedBy),
        }
      : null,
    publishedAt: formatPublishedDate(publishedAt),
    lastReviewedAt: lastReviewedAt ? formatPublishedDate(lastReviewedAt) : null,
    nextReviewDue: computeNextReviewDue(lastReviewedAt, publishedAt),
  };
}
