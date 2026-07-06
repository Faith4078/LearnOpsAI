import { afterEach, describe, expect, it, vi } from "vitest";

import { generateContent } from "@/actions/generate-content";
import { setModelCaller } from "@/lib/ai";
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
};

afterEach(() => {
  setModelCaller(null);
  vi.unstubAllEnvs();
});

describe("generateContent", () => {
  it("returns a validated bundle on the happy path", async () => {
    setModelCaller(async () => JSON.stringify(validBundle));

    const result = await generateContent("Widgets are the core building block.");

    expect(result).toEqual({ status: "success", bundle: validBundle });
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
      throw new Error("rate limited");
    });

    const result = await generateContent("Some documentation");

    expect(result).toMatchObject({ status: "error", code: "api-error" });
  });
});
