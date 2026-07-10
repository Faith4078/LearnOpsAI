/**
 * Presentational freshness derivation for the governance sidebar — no
 * new storage. A Knowledge Asset is freshest right after its last
 * review (falling back to its publish date) and decays linearly to 0
 * over `FULL_DECAY_DAYS`.
 */

const FULL_DECAY_DAYS = 180;

export type FreshnessLabel = "Fresh" | "Aging" | "Stale";

export interface Freshness {
  /** 0-100; 100 means reviewed today. */
  score: number;
  label: FreshnessLabel;
}

export function freshnessLabel(score: number): FreshnessLabel {
  if (score >= 75) return "Fresh";
  if (score >= 40) return "Aging";
  return "Stale";
}

/**
 * Computes freshness from the most recent of lastReviewedAt/publishedAt.
 * Returns null when no parseable date is available (old documents).
 */
export function computeFreshness(
  dates: { publishedAt?: string | null; lastReviewedAt?: string | null },
  now: Date = new Date(),
): Freshness | null {
  const timestamps = [dates.lastReviewedAt, dates.publishedAt]
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((value) => !Number.isNaN(value));
  if (timestamps.length === 0) return null;

  const reference = Math.max(...timestamps);
  const ageDays = Math.max(0, (now.getTime() - reference) / 86_400_000);
  const score = Math.max(0, Math.round(100 * (1 - ageDays / FULL_DECAY_DAYS)));
  return { score, label: freshnessLabel(score) };
}
