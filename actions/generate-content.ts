"use server";

import {
  buildGeneratorPrompt,
  contentBundleSchema,
  generateWithGemini,
} from "@/lib/ai";
import type { GenerateContentResult } from "@/lib/types";

const ERROR_MESSAGES = {
  "empty-input":
    "Please add source documentation before running the publishing workflow.",
  "missing-config":
    "The AI service is not configured. Ask an administrator to set GEMINI_API_KEY.",
  "api-error":
    "The AI service could not be reached. Please try again in a moment.",
  "rate-limit":
    "The AI service is busy right now. Please wait a moment and try again.",
  "invalid-response":
    "The AI returned content in an unexpected format. Please try again.",
} as const;

type GenerateErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * How many times the Generator Agent re-attempts generation when the model
 * returns unusable output (malformed JSON, or content that fails the bundle
 * schema). This is autonomous recovery from a flaky generation — distinct
 * from, and layered on top of, the transport-level retries that
 * `generateWithGemini` already performs for transient network failures.
 */
const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Generator Agent: turns raw documentation into a validated content bundle
 * in a single Gemini call.
 *
 * When the model returns unusable output, generation is re-attempted up to
 * `MAX_GENERATION_ATTEMPTS` times without any human intervention; only if
 * every attempt fails does the failure surface. Transport failures
 * (api-error, rate-limit) are already retried inside `generateWithGemini`
 * and missing-config is terminal, so those short-circuit rather than
 * re-prompting. Never throws — every failure maps to a typed error the UI
 * can render as a friendly message.
 */
export async function generateContent(
  documentation: string,
): Promise<GenerateContentResult> {
  if (documentation.trim() === "") {
    return {
      status: "error",
      code: "empty-input",
      message: ERROR_MESSAGES["empty-input"],
    };
  }

  const prompt = buildGeneratorPrompt(documentation);

  let lastError: GenerateErrorCode = "invalid-response";
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const result = await generateWithGemini(prompt);
    if (!result.ok) {
      lastError = result.error.code;
      // Only unusable model output is worth re-prompting. Transport errors
      // are already retried with backoff inside generateWithGemini, and
      // missing-config is terminal — re-prompting those would not help.
      if (result.error.code !== "invalid-response") break;
      continue;
    }

    const parsed = contentBundleSchema.safeParse(result.data);
    if (parsed.success) {
      return { status: "success", bundle: parsed.data };
    }

    // Well-formed JSON that does not match the bundle schema — re-prompt.
    lastError = "invalid-response";
  }

  return { status: "error", code: lastError, message: ERROR_MESSAGES[lastError] };
}
