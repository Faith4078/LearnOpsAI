import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reviewContent } from "@/actions/review-content";
import { setModelCaller, setRetryDelays } from "@/lib/ai";
import type { ContentBundle, ReviewReport } from "@/lib/types";

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
  educationalMetadata: {
    learningObjectives: ["Create a widget"],
    estimatedReadingMinutes: 3,
    difficulty: "beginner",
    targetAudience: "New customers",
    prerequisites: [],
  },
};

const improvedBundle: ContentBundle = {
  ...draftBundle,
  title: "Getting Started with Widgets",
  summary: "Learn how to create and configure widgets, step by step.",
  article:
    "# Getting Started with Widgets\n\nWidgets are the core building block of the product.",
};

const reviewReport: ReviewReport = {
  overallQualityScore: 88,
  readabilityAssessment:
    "Clear, beginner-friendly prose that suits new customers.",
  changesMade: [
    { category: "clarity", description: "Tightened the introduction." },
    { category: "formatting", description: "Normalized heading levels." },
  ],
  publishingRecommendation: "ready",
};

/** The Review Agent's complete single-call response. */
const reviewResponse = { bundle: improvedBundle, reviewReport };

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
  it("returns the improved bundle and QA report on the happy path", async () => {
    const prompts: string[] = [];
    setModelCaller(async (prompt) => {
      prompts.push(prompt);
      return JSON.stringify(reviewResponse);
    });

    const result = await reviewContent(draftBundle);

    expect(result).toEqual({
      status: "success",
      bundle: improvedBundle,
      report: reviewReport,
    });
    // Exactly one call, carrying the complete draft bundle — the QA
    // report rides in the same response, never a second call.
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain(draftBundle.title);
    expect(prompts[0]).toContain(draftBundle.quiz[0].question);
    expect(prompts[0]).toContain(draftBundle.faqs[0].answer);
  });

  it("autonomously retries when the Review Agent first returns unusable output", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      // First attempt: malformed output. Second attempt: a valid review.
      return calls === 1 ? "not valid json {" : JSON.stringify(reviewResponse);
    });

    const result = await reviewContent(draftBundle);

    // Recovered on its own — no human re-run needed.
    expect(result).toEqual({
      status: "success",
      bundle: improvedBundle,
      report: reviewReport,
    });
    expect(calls).toBe(2);
  });

  it("re-prompts when the model returns JSON that fails the review schema", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      // First attempt: score out of range. Second attempt: a valid review.
      return calls === 1
        ? JSON.stringify({
            bundle: improvedBundle,
            reviewReport: { ...reviewReport, overallQualityScore: 250 },
          })
        : JSON.stringify(reviewResponse);
    });

    const result = await reviewContent(draftBundle);

    expect(result.status).toBe("success");
    expect(calls).toBe(2);
  });

  it("gives up after exhausting the review retries", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      return "still not valid json {";
    });

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(calls).toBe(3); // MAX_REVIEW_ATTEMPTS
  });

  it("does not re-prompt on a transport failure (already retried by the provider)", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      throw new Error("network unreachable");
    });

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "api-error" });
    // 3 transport attempts inside generateWithGemini, but the action does
    // not re-prompt on top of them (no 9-call blow-up).
    expect(calls).toBe(3);
  });

  it("returns invalid-response when the QA report is missing", async () => {
    // A bare bundle (the pre-report response shape) is no longer valid.
    setModelCaller(async () => JSON.stringify(improvedBundle));

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
  });

  it("returns invalid-response when the QA report fails validation", async () => {
    setModelCaller(async () =>
      JSON.stringify({
        bundle: improvedBundle,
        reviewReport: { ...reviewReport, overallQualityScore: 250 },
      }),
    );

    const result = await reviewContent(draftBundle);

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
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
