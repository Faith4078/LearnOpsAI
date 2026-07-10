/**
 * Derives the display name of a source documentation blob — the "name of
 * the Markdown posted" — used to label a Knowledge Asset's documentation
 * provenance in the Content Governance panel.
 *
 * Preference order: the first Markdown H1 heading (`# ...`), else the
 * first non-empty line. Purely presentational; no storage of its own.
 */

/** Longest name we keep; headings/first lines beyond this are truncated. */
const MAX_NAME_LENGTH = 80;

function clamp(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > MAX_NAME_LENGTH
    ? `${trimmed.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…`
    : trimmed;
}

export function documentationName(markdown: string): string {
  const lines = markdown.split(/\r?\n/);

  // Prefer a top-level Markdown heading, e.g. "# Matter Search".
  for (const line of lines) {
    const heading = /^#\s+(.+?)\s*#*\s*$/.exec(line.trim());
    if (heading) return clamp(heading[1]);
  }

  // Otherwise fall back to the first non-empty line.
  for (const line of lines) {
    if (line.trim().length > 0) return clamp(line);
  }

  return "";
}
