import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reviewContent } from "@/actions/review-content";
import { setModelCaller, setRetryDelays } from "@/lib/ai";
import type { ContentBundle } from "@/lib/types";

/**
 * Seam tests: `reviewContent` end-to-end with the Gemini provider faked
 * at its single injection point (`setModelCaller` in lib/ai/gemini.ts).
 * No network access anywhere in this file.
 */

const draftBundle: ContentBundle = {
  title: "getting started with widgets",
  slug: "getting-started-with-widgets",
  summary: "learn widgets.",
  article: "# getting started\n\nwidgets are the core building block.",
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

const improvedBundle: ContentBundle = {
  ...draftBundle,
  title: "Getting Started with Widgets",
  summary: "Learn how to create and configure widgets, step by step.",
  article:
    "# Getting Started with Widgets\n\nWidgets are the core building block of the product.",
};

beforeEach(() => {
  // Instant retries: no real waiting in tests.
  setRetryDelays([0, 0]);
});

afterEach(() => {
  setModelCaller(null);
  setRetryDelays(null);
  vi.unstubAllEnvs();
});

describe("reviewContent", () => {
  it("returns the improved, validated bundle on the happy path", async () => {
    const prompts: string[] = [];
    setModelCaller(async (prompt) => {
      prompts.push(prompt);
      return JSON.stringify(improvedBundle);
    });

    const result = await reviewContent(draftBundle);

    expect(result).toEqual({ status: "success", bundle: improvedBundle });
    // Exactly one call, carrying the complete draft bundle.
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain(draftBundle.title);
    expect(prompts[0]).toContain(draftBundle.quiz[0].question);
    expect(prompts[0]).toContain(draftBundle.faqs[0].answer);
  });

  it("returns invalid-response when the model returns malformed JSON", async () => {
    setModelCaller(async () => "not json at all {");

    const result = await reviewContent(draftBundle);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("invalid-response");
      expect(result.message).not.toContain("{");
    }
  });

  it("returns invalid-response when JSON does not match the bundle schema", async () => {
    setModelCaller(async () => JSON.stringify({ title: "only a title" }));

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
  });

  it("returns api-error when the provider call fails", async () => {
    setModelCaller(async () => {
      throw new Error("network unreachable");
    });

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "api-error" });
  });

  it("returns missing-config when GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "missing-config" });
  });
});
