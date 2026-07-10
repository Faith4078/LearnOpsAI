import { afterEach, describe, expect, it, vi } from "vitest";

import { publishToSanity } from "@/actions/publish-to-sanity";
import type { PublishReviewRecord } from "@/actions/publish-to-sanity";
import { GEMINI_MODEL, REVIEW_AGENT_VERSION } from "@/lib/ai";
import { setSanityWriter } from "@/lib/sanity";
import type { HelpArticleDoc, SanityWriter } from "@/lib/sanity";
import type { ContentBundle, ReviewReport } from "@/lib/types";
import { dedupeSlug, normalizeSlug } from "@/utils/slug";

// revalidatePath needs a Next.js request context that vitest doesn't
// provide; stub it to a no-op so publish tests exercise the write path.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * Seam tests: `publishToSanity` end-to-end with Sanity faked at its
 * single injection point (`setSanityWriter` in lib/sanity/client.ts).
 * No network access anywhere in this file.
 */

const validBundle: ContentBundle = {
  title: "Getting Started with Widgets",
  slug: "Getting Started With Widgets!",
  summary: "Learn how to create and configure widgets.",
  article: "# Getting Started\n\nWidgets are the core building block.",
  faqs: [{ question: "What is a widget?", answer: "A reusable component." }],
  quiz: [
    {
      question: "What is a widget?",
      options: ["A component", "A server", "A database", "A theme"],
      answer: "A component",
      explanation: "Widgets are reusable components.",
    },
  ],
  educationalMetadata: {
    learningObjectives: ["Create a widget", "Configure a widget"],
    estimatedReadingMinutes: 4,
    difficulty: "beginner",
    targetAudience: "New customers setting up their first widget",
    prerequisites: ["An active account"],
  },
};

const validReport: ReviewReport = {
  overallQualityScore: 91,
  readabilityAssessment: "Reads clearly for first-time customers.",
  changesMade: [
    { category: "clarity", description: "Tightened the introduction." },
  ],
  publishingRecommendation: "ready",
};

const validReview: PublishReviewRecord = {
  report: validReport,
  documentationVersion: "doc-0a1b2c3d",
  processingSeconds: 42,
};

function fakeWriter(overrides: Partial<SanityWriter> = {}): {
  writer: SanityWriter;
  created: HelpArticleDoc[];
} {
  const created: HelpArticleDoc[] = [];
  const writer: SanityWriter = {
    fetchSlugsMatching: async () => [],
    createHelpArticle: async (doc) => {
      created.push(doc);
      return "doc-id-1";
    },
    ...overrides,
  };
  return { writer, created };
}

afterEach(() => {
  setSanityWriter(null);
  vi.unstubAllEnvs();
});

describe("publishToSanity", () => {
  it("creates a document with all bundle fields and publishedAt", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity(validBundle, validReview);

    expect(result).toEqual({
      status: "success",
      slug: "getting-started-with-widgets",
    });
    expect(created).toHaveLength(1);
    const doc = created[0];
    expect(doc.title).toBe(validBundle.title);
    expect(doc.summary).toBe(validBundle.summary);
    expect(doc.article).toBe(validBundle.article);
    expect(doc.faqs).toEqual(validBundle.faqs);
    expect(doc.quiz).toEqual(validBundle.quiz);
    expect(Date.parse(doc.publishedAt)).not.toBeNaN();
  });

  it("maps educational metadata onto the created document", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    await publishToSanity(validBundle, validReview);

    expect(created[0].educationalMetadata).toEqual(
      validBundle.educationalMetadata,
    );
  });

  it("maps the review outcome and provenance into the governance record", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);
    const before = Date.now();

    await publishToSanity(validBundle, validReview);

    const governance = created[0].governance;
    expect(governance.reviewScore).toBe(validReport.overallQualityScore);
    expect(governance.publishingRecommendation).toBe(
      validReport.publishingRecommendation,
    );
    expect(governance.generatedBy).toBe(GEMINI_MODEL);
    expect(governance.reviewAgentVersion).toBe(REVIEW_AGENT_VERSION);
    expect(governance.documentationVersion).toBe(
      validReview.documentationVersion,
    );
    expect(governance.processingSeconds).toBe(42);
    // lastReviewedAt is stamped at publish time, matching publishedAt.
    expect(governance.lastReviewedAt).toBe(created[0].publishedAt);
    expect(Date.parse(governance.lastReviewedAt)).toBeGreaterThanOrEqual(
      before,
    );
  });

  it("rejects an invalid QA report without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity(validBundle, {
      ...validReview,
      report: {
        ...validReport,
        overallQualityScore: -5,
      },
    });

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(created).toHaveLength(0);
  });

  it("rejects a missing documentation version without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity(validBundle, {
      ...validReview,
      documentationVersion: "",
    });

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(created).toHaveLength(0);
  });

  it("rejects an invalid processing time without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity(validBundle, {
      ...validReview,
      processingSeconds: -1,
    });

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(created).toHaveLength(0);
  });

  it("rejects a bundle missing educational metadata without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);
    const { educationalMetadata: _omitted, ...withoutMetadata } = validBundle;

    const result = await publishToSanity(
      withoutMetadata as ContentBundle,
      validReview,
    );

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(created).toHaveLength(0);
  });

  it("normalizes the AI-generated slug", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    await publishToSanity({ ...validBundle, slug: "Hello World!" }, validReview);

    expect(created[0].slug).toBe("hello-world");
  });

  it("de-duplicates a colliding slug with a numeric suffix", async () => {
    const { writer, created } = fakeWriter({
      fetchSlugsMatching: async () => ["hello-world", "hello-world-2"],
    });
    setSanityWriter(writer);

    const result = await publishToSanity(
      { ...validBundle, slug: "Hello World" },
      validReview,
    );

    expect(result).toEqual({ status: "success", slug: "hello-world-3" });
    expect(created[0].slug).toBe("hello-world-3");
  });

  it("maps a Sanity write failure to a sanity-error result", async () => {
    const { writer } = fakeWriter({
      createHelpArticle: async () => {
        throw new Error("boom");
      },
    });
    setSanityWriter(writer);

    const result = await publishToSanity(validBundle, validReview);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("sanity-error");
      expect(result.message).not.toContain("boom");
    }
  });

  it("returns missing-config when Sanity env vars are absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "");
    vi.stubEnv("SANITY_API_TOKEN", "");

    const result = await publishToSanity(validBundle, validReview);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("missing-config");
    }
  });

  it("rejects an invalid bundle without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity(
      {
        ...validBundle,
        title: "",
      } as ContentBundle,
      validReview,
    );

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("invalid-response");
    }
    expect(created).toHaveLength(0);
  });
});

describe("slug utilities", () => {
  it("normalizes messy input", () => {
    expect(normalizeSlug("  Héllo -- Wörld! ", "fallback")).toBe("hello-world");
  });

  it("falls back to the title when the slug is unusable", () => {
    expect(normalizeSlug("!!!", "My Great Article")).toBe("my-great-article");
  });

  it("dedupes against existing slugs", () => {
    expect(dedupeSlug("a", [])).toBe("a");
    expect(dedupeSlug("a", ["a"])).toBe("a-2");
    expect(dedupeSlug("a", ["a", "a-2", "a-3"])).toBe("a-4");
  });
});
