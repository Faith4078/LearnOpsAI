import type { Faq, QuizQuestion } from "@/lib/ai/schemas";

/** The `helpArticle` document shape written to Sanity. */
export interface HelpArticleDoc {
  title: string;
  slug: string;
  summary: string;
  article: string;
  faqs: Faq[];
  quiz: QuizQuestion[];
  publishedAt: string;
}

/**
 * The seam through which the app writes to Sanity. Tests fake this
 * interface (via `setSanityWriter`) exactly like the AI `ModelCaller`.
 */
export interface SanityWriter {
  /** All existing slugs starting with the given base, for de-duplication. */
  fetchSlugsMatching(baseSlug: string): Promise<string[]>;
  /** Creates the document and returns its Sanity id. */
  createHelpArticle(doc: HelpArticleDoc): Promise<string>;
}

export interface SanityError {
  code: "missing-config" | "sanity-error";
  message: string;
}

export type SanityResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SanityError };
