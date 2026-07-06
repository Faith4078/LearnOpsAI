/**
 * Normalizes an AI-generated slug (or falls back to the title) into a
 * URL-safe form: lowercase, hyphen-separated, ASCII-ish, bounded length.
 */
export function normalizeSlug(candidate: string, fallback: string): string {
  const normalize = (value: string): string =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96)
      .replace(/-+$/g, "");

  return normalize(candidate) || normalize(fallback) || "article";
}

/**
 * De-duplicates a slug against existing ones: returns the base slug if
 * free, otherwise the first free `base-2`, `base-3`, … suffix.
 */
export function dedupeSlug(baseSlug: string, existing: string[]): string {
  const taken = new Set(existing);
  if (!taken.has(baseSlug)) {
    return baseSlug;
  }
  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}
