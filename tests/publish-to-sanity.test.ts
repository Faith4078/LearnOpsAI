import { afterEach, describe, expect, it, vi } from "vitest";

import { publishToSanity } from "@/actions/publish-to-sanity";
import { setSanityWriter } from "@/lib/sanity";
import type { HelpArticleDoc, SanityWriter } from "@/lib/sanity";
import type { ContentBundle } from "@/lib/types";
import { dedupeSlug, normalizeSlug } from "@/utils/slug";

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

    const result = await publishToSanity(validBundle);

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

  it("normalizes the AI-generated slug", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    await publishToSanity({ ...validBundle, slug: "Hello World!" });

    expect(created[0].slug).toBe("hello-world");
  });

  it("de-duplicates a colliding slug with a numeric suffix", async () => {
    const { writer, created } = fakeWriter({
      fetchSlugsMatching: async () => ["hello-world", "hello-world-2"],
    });
    setSanityWriter(writer);

    const result = await publishToSanity({ ...validBundle, slug: "Hello World" });

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

    const result = await publishToSanity(validBundle);

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

    const result = await publishToSanity(validBundle);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("missing-config");
    }
  });

  it("rejects an invalid bundle without touching Sanity", async () => {
    const { writer, created } = fakeWriter();
    setSanityWriter(writer);

    const result = await publishToSanity({
      ...validBundle,
      title: "",
    } as ContentBundle);

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
