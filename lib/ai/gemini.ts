import { GoogleGenAI } from "@google/genai";
import type { AiResult, ModelCaller } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Test seam: when set, `generateWithGemini` uses this caller instead of
 * the real Gemini SDK. This is the only place the provider can be faked.
 */
let modelCallerOverride: ModelCaller | null = null;

export function setModelCaller(caller: ModelCaller | null): void {
  modelCallerOverride = caller;
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
 * model configuration, JSON-mode generation, and JSON parsing. Returns
 * a typed result and never throws — the agent layer never touches the
 * provider SDK or raw responses.
 */
export async function generateWithGemini(
  prompt: string,
): Promise<AiResult<unknown>> {
  let caller = modelCallerOverride;
  if (caller === null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey === undefined || apiKey.trim() === "") {
      return {
        ok: false,
        error: {
          code: "missing-config",
          message:
            "GEMINI_API_KEY is not configured. Add it to your environment (see .env.example).",
        },
      };
    }
    caller = createGeminiCaller(apiKey);
  }

  let raw: string;
  try {
    raw = await caller(prompt);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      error: { code: "api-error", message: `Gemini request failed: ${message}` },
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
