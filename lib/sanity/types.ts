import type {
  Difficulty,
  EducationalMetadata,
  Faq,
  PublishingRecommendation,
  QuizQuestion,
} from "@/lib/ai/schemas";

/**
 * Governance record carried by every published Knowledge Asset: the
 * review outcome plus provenance of how the asset was produced.
 */
export interface ArticleGovernance {
  reviewScore: number;
  publishingRecommendation: PublishingRecommendation;
  /** Model identifier that generated the asset, e.g. "gemini-2.5-flash". */
  generatedBy: string;
  /** Reviewer prompt version constant, e.g. "review-agent/v1". */
  reviewAgentVersion: string;
  /** Fingerprint/label of the source documentation the asset came from. */
  documentationVersion: string;
  /** Wall-clock seconds the AI pipeline (generate + review) took to produce it. */
  processingSeconds: number;
  lastReviewedAt: string;
}

/** The `helpArticle` document shape written to Sanity. */
export interface HelpArticleDoc {
  title: string;
  slug: string;
  summary: string;
  article: string;
  faqs: Faq[];
  quiz: QuizQuestion[];
  educationalMetadata: EducationalMetadata;
  governance: ArticleGovernance;
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

/**
 * Listing-page projection of a published help article. Documents
 * published before educational metadata existed lack the hint fields,
 * so they are optional on every read type.
 */
export interface HelpArticleSummary {
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  difficulty?: Difficulty | null;
  readingMinutes?: number | null;
  /** Absent on documents published before governance existed. */
  reviewScore?: number | null;
  /** Seconds the AI pipeline took; absent before this was recorded. */
  processingSeconds?: number | null;
}

/** The full `helpArticle` document as read back from Sanity. */
export interface HelpArticle extends HelpArticleSummary {
  article: string;
  faqs: Faq[];
  quiz: QuizQuestion[];
  /** Absent on documents published before this field existed. */
  educationalMetadata?: EducationalMetadata | null;
  /** Absent on documents published before governance existed. */
  governance?: ArticleGovernance | null;
}

/**
 * The seam through which the app reads from Sanity. Tests fake this
 * interface (via `setSanityReader`) exactly like `SanityWriter`.
 */
export interface SanityReader {
  /** All published article summaries; order is normalized by the caller. */
  fetchArticleSummaries(): Promise<HelpArticleSummary[]>;
  /** The full article for a slug, or null when no document matches. */
  fetchArticleBySlug(slug: string): Promise<HelpArticle | null>;
}

export interface SanityError {
  code: "missing-config" | "sanity-error";
  message: string;
}

export type SanityResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SanityError };
