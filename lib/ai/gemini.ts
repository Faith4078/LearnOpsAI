import { GoogleGenAI } from "@google/genai";

import { checkEnv } from "@/utils/env";

import type { AiResult, ModelCaller } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";

/** Total attempts per generation: 1 initial + 2 retries. */
const MAX_ATTEMPTS = 3;

/** Base delay for exponential backoff (doubled per retry, plus jitter). */
const BASE_RETRY_DELAY_MS = 500;
const RETRY_JITTER_MS = 250;

/**
 * Test seam: when set, `generateWithGemini` uses this caller instead of
 * the real Gemini SDK. This is the only place the provider can be faked.
 */
let modelCallerOverride: ModelCaller | null = null;

export function setModelCaller(caller: ModelCaller | null): void {
  modelCallerOverride = caller;
}

/**
 * Test seam: when set, these delays (in ms, indexed by retry number)
 * replace the exponential-backoff schedule so tests run instantly
 * without fake timers. Pass `null` to restore real backoff.
 */
let retryDelaysOverride: number[] | null = null;

export function setRetryDelays(delays: number[] | null): void {
  retryDelaysOverride = delays;
}

function retryDelayMs(retryIndex: number): number {
  if (retryDelaysOverride !== null) {
    return retryDelaysOverride[retryIndex] ?? 0;
  }
  return (
    BASE_RETRY_DELAY_MS * 2 ** retryIndex + Math.random() * RETRY_JITTER_MS
  );
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pulls a numeric HTTP-ish status out of a thrown provider error. */
function extractStatus(cause: unknown): number | null {
  if (typeof cause !== "object" || cause === null) return null;
  const candidate = cause as { status?: unknown; code?: unknown };
  for (const value of [candidate.status, candidate.code]) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d{3}$/.test(value)) {
      return Number(value);
    }
  }
  return null;
}

function isRateLimitError(cause: unknown): boolean {
  if (extractStatus(cause) === 429) return true;
  const message = cause instanceof Error ? cause.message : String(cause);
  return /\b429\b|rate.?limit|RESOURCE_EXHAUSTED|quota/i.test(message);
}

function createGeminiCaller(apiKey: string): ModelCaller {
  const client = new GoogleGenAI({ apiKey });
  return async (prompt) => {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return response.text ?? "";
  };
}

/**
 * Single entry point to the AI provider. Owns client initialization,
 * model configuration, JSON-mode generation, JSON parsing, and retries.
 * Returns a typed result and never throws — the agent layer never
 * touches the provider SDK or raw responses.
 *
 * Transient provider failures (429/5xx/network errors thrown by the
 * caller) are retried up to 2 more times with exponential backoff and
 * jitter. Invalid JSON and missing configuration are never retried.
 */
export async function generateWithGemini(
  prompt: string,
): Promise<AiResult<unknown>> {
  let caller = modelCallerOverride;
  if (caller === null) {
    const env = checkEnv(["GEMINI_API_KEY"]);
    if (!env.ok) {
      return {
        ok: false,
        error: {
          code: "missing-config",
          message: `The AI service is not configured. ${env.message}`,
        },
      };
    }
    caller = createGeminiCaller(process.env.GEMINI_API_KEY as string);
  }

  let raw: string | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      raw = await caller(prompt);
      break;
    } catch (cause) {
      lastError = cause;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(retryDelayMs(attempt));
      }
    }
  }

  if (raw === null) {
    const message =
      lastError instanceof Error ? lastError.message : String(lastError);
    if (isRateLimitError(lastError)) {
      return {
        ok: false,
        error: {
          code: "rate-limit",
          message: `Gemini rate limit reached after ${MAX_ATTEMPTS} attempts: ${message}`,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "api-error",
        message: `Gemini request failed after ${MAX_ATTEMPTS} attempts: ${message}`,
      },
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      error: {
        code: "invalid-response",
        message: "The model did not return valid JSON.",
      },
    };
  }
}
