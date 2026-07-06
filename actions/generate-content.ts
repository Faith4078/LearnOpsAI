"use server";

import {
  buildGeneratorPrompt,
  contentBundleSchema,
  generateWithGemini,
} from "@/lib/ai";
import type { GenerateContentResult } from "@/lib/types";

const ERROR_MESSAGES = {
  "empty-input": "Please paste some documentation before generating content.",
  "missing-config":
    "The AI service is not configured. Ask an administrator to set GEMINI_API_KEY.",
  "api-error":
    "The AI service could not be reached. Please try again in a moment.",
  "rate-limit":
    "The AI service is busy right now. Please wait a moment and try again.",
  "invalid-response":
    "The AI returned content in an unexpected format. Please try again.",
} as const;

/**
 * Generator Agent: turns raw documentation into a validated content
 * bundle in a single Gemini call. Never throws — every failure maps to
 * a typed error the UI can render as a friendly message.
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

  const result = await generateWithGemini(buildGeneratorPrompt(documentation));
  if (!result.ok) {
    return {
      status: "error",
      code: result.error.code,
      message: ERROR_MESSAGES[result.error.code],
    };
  }

  const parsed = contentBundleSchema.safeParse(result.data);
  if (!parsed.success) {
    return {
      status: "error",
      code: "invalid-response",
      message: ERROR_MESSAGES["invalid-response"],
    };
  }

  return { status: "success", bundle: parsed.data };
}
