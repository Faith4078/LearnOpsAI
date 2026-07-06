import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateWithGemini, setModelCaller, setRetryDelays } from "@/lib/ai";

/**
 * Resilience tests for the retry/backoff layer in `generateWithGemini`
 * (issue #7). The provider is faked via `setModelCaller` and the backoff
 * schedule is zeroed via `setRetryDelays`, so no network and no real
 * waiting happen anywhere in this file.
 */

function rateLimitError(): Error {
  const error = new Error("Resource has been exhausted");
  (error as Error & { status: number }).status = 429;
  return error;
}

beforeEach(() => {
  setRetryDelays([0, 0]);
});

afterEach(() => {
  setModelCaller(null);
  setRetryDelays(null);
  vi.unstubAllEnvs();
});

describe("generateWithGemini retries", () => {
  it("succeeds after one transient failure then success", async () => {
    const caller = vi
      .fn<(prompt: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(JSON.stringify({ hello: "world" }));
    setModelCaller(caller);

    const result = await generateWithGemini("prompt");

    expect(result).toEqual({ ok: true, data: { hello: "world" } });
    expect(caller).toHaveBeenCalledTimes(2);
  });

  it("returns rate-limit after exhausting retries on persistent 429", async () => {
    const caller = vi
      .fn<(prompt: string) => Promise<string>>()
      .mockRejectedValue(rateLimitError());
    setModelCaller(caller);

    const result = await generateWithGemini("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("rate-limit");
    }
    expect(caller).toHaveBeenCalledTimes(3);
  });

  it("detects rate limits from 5xx-free string codes and messages", async () => {
    const caller = vi
      .fn<(prompt: string) => Promise<string>>()
      .mockRejectedValue(new Error("429 Too Many Requests"));
    setModelCaller(caller);

    const result = await generateWithGemini("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("rate-limit");
    }
  });

  it("returns api-error after exhausting retries on persistent generic failure", async () => {
    const caller = vi
      .fn<(prompt: string) => Promise<string>>()
      .mockRejectedValue(new Error("fetch failed"));
    setModelCaller(caller);

    const result = await generateWithGemini("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("api-error");
    }
    expect(caller).toHaveBeenCalledTimes(3);
  });

  it("does not retry malformed JSON responses", async () => {
    const caller = vi
      .fn<(prompt: string) => Promise<string>>()
      .mockResolvedValue("definitely not json {");
    setModelCaller(caller);

    const result = await generateWithGemini("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid-response");
    }
    expect(caller).toHaveBeenCalledTimes(1);
  });

  it("does not retry when GEMINI_API_KEY is missing and names the variable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateWithGemini("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("missing-config");
      expect(result.error.message).toContain("GEMINI_API_KEY");
    }
  });
});
