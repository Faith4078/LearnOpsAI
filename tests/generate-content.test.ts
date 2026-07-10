import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateContent } from "@/actions/generate-content";
import { setModelCaller, setRetryDelays } from "@/lib/ai";
import type { ContentBundle } from "@/lib/types";

/**
 * Seam tests: `generateContent` end-to-end with the Gemini provider faked
 * at its single injection point (`setModelCaller` in lib/ai/gemini.ts).
 * No network access anywhere in this file.
 */

const validBundle: ContentBundle = {
  title: "Getting Started with Widgets",
  slug: "getting-started-with-widgets",
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
    prerequisites: [],
  },
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

describe("generateContent", () => {
  it("returns a validated bundle on the happy path", async () => {
    setModelCaller(async () => JSON.stringify(validBundle));

    const result = await generateContent("Widgets are the core building block.");

    expect(result).toEqual({ status: "success", bundle: validBundle });
  });

  it("autonomously retries when the Generator Agent first returns unusable output", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      // First attempt: malformed output. Second attempt: a valid bundle.
      return calls === 1 ? "this is not json {" : JSON.stringify(validBundle);
    });

    const result = await generateContent("Some documentation");

    // Recovered on its own — no human re-run needed.
    expect(result).toEqual({ status: "success", bundle: validBundle });
    expect(calls).toBe(2);
  });

  it("gives up after exhausting the generation retries", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      return "still not valid json {";
    });

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
    expect(calls).toBe(3); // MAX_GENERATION_ATTEMPTS
  });

  it("does not re-prompt on a transport failure (already retried by the provider)", async () => {
    let calls = 0;
    setModelCaller(async () => {
      calls += 1;
      throw new Error("network unreachable");
    });

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "api-error" });
    // 3 transport attempts inside generateWithGemini, but the action does
    // not re-prompt on top of them (no 9-call blow-up).
    expect(calls).toBe(3);
  });

  it("returns invalid-response when the model returns malformed JSON", async () => {
    setModelCaller(async () => "this is not json {");

    const result = await generateContent("Some documentation");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("invalid-response");
      expect(result.message).not.toContain("{");
    }
  });

  it("returns invalid-response when JSON does not match the bundle schema", async () => {
    setModelCaller(async () => JSON.stringify({ title: "only a title" }));

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
  });

  it("returns invalid-response when educational metadata is missing", async () => {
    const { educationalMetadata: _omitted, ...withoutMetadata } = validBundle;
    setModelCaller(async () => JSON.stringify(withoutMetadata));

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
  });

  it("returns invalid-response when educational metadata is invalid", async () => {
    setModelCaller(async () =>
      JSON.stringify({
        ...validBundle,
        educationalMetadata: {
          ...validBundle.educationalMetadata,
          learningObjectives: [],
          estimatedReadingMinutes: -3,
          difficulty: "expert",
        },
      }),
    );

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "invalid-response" });
  });

  it("returns empty-input for whitespace-only input without calling the provider", async () => {
    const caller = vi.fn(async () => JSON.stringify(validBundle));
    setModelCaller(caller);

    const result = await generateContent("   \n\t  ");

    expect(result).toMatchObject({ status: "error", code: "empty-input" });
    expect(caller).not.toHaveBeenCalled();
  });

  it("returns missing-config when GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "missing-config" });
  });

  it("returns api-error when the provider call fails", async () => {
    setModelCaller(async () => {
      throw new Error("network unreachable");
    });

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "api-error" });
  });
});
