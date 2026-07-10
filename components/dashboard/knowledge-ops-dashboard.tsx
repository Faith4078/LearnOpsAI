import type { KnowledgeOpsStats } from "@/lib/education/stats";
import { formatPublishedDate } from "@/utils/date";

interface StatTile {
  label: string;
  value: string;
}

function buildTiles(stats: KnowledgeOpsStats | null): StatTile[] {
  return [
    {
      label: "Published articles",
      value: stats === null ? "—" : String(stats.publishedCount),
    },
    {
      label: "AI generations",
      value: stats === null ? "—" : String(stats.aiGenerations),
    },
    {
      label: "AI reviews completed",
      value: stats === null ? "—" : String(stats.aiReviewsCompleted),
    },
    {
      label: "Avg review score",
      value:
        stats?.averageReviewScore == null
          ? "—"
          : `${stats.averageReviewScore} / 100`,
    },
    {
      label: "Avg processing time",
      value:
        stats?.averageProcessingSeconds == null
          ? "—"
          : `${stats.averageProcessingSeconds}s`,
    },
    {
      label: "Knowledge base freshness",
      value:
        stats?.knowledgeBaseFreshness == null
          ? "—"
          : `${stats.knowledgeBaseFreshness.badge.label} (${stats.knowledgeBaseFreshness.percent}%)`,
    },
    {
      label: "Last published",
      value:
        stats?.lastPublishedAt == null
          ? "—"
          : formatPublishedDate(stats.lastPublishedAt),
    },
  ];
}

interface KnowledgeOpsDashboardProps {
  /** Null when live stats could not be loaded (e.g. Sanity unconfigured). */
  stats: KnowledgeOpsStats | null;
  /** Shown when live stats are unavailable. */
  errorMessage?: string;
}

/**
 * Compact Knowledge Operations Dashboard: the health and performance of
 * the AI-powered publishing pipeline at a glance. Every figure is derived
 * live from the published article dataset — no workflow states the MVP
 * does not implement, and no placeholder numbers.
 */
export function KnowledgeOpsDashboard({
  stats,
  errorMessage,
}: KnowledgeOpsDashboardProps) {
  const tiles = buildTiles(stats);

  return (
    <section
      aria-label="Knowledge operations dashboard"
      className="rounded-lg border bg-card p-6"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-normal tracking-tight">
          Knowledge Operations
        </h2>
        {stats === null && errorMessage !== undefined && (
          <p className="text-xs text-muted-foreground">{errorMessage}</p>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-7 lg:gap-x-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="grid content-start gap-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </dt>
            <dd className="font-serif text-2xl font-normal tracking-tight">
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
