"use server";

import {
  buildReviewerPrompt,
  contentBundleSchema,
  generateWithGemini,
} from "@/lib/ai";
import type { ContentBundle, ReviewContentResult } from "@/lib/types";

const ERROR_MESSAGES = {
  "missing-config":
    "The AI service is not configured. Ask an administrator to set GEMINI_API_KEY.",
  "api-error":
    "The Review Agent could not be reached. Please try again in a moment.",
  "rate-limit":
    "The AI service is busy right now. Please wait a moment and try again.",
  "invalid-response":
    "The Review Agent returned content in an unexpected format. Please try again.",
} as const;

/**
 * Review Agent: takes the Generator Agent's complete bundle and improves
 * clarity, structure, and quiz quality in a single Gemini call. Never
 * throws — every failure maps to a typed error the UI can render.
 */
export async function reviewContent(
  bundle: ContentBundle,
): Promise<ReviewContentResult> {
  const draft = contentBundleSchema.safeParse(bundle);
  if (!draft.success) {
    return {
      status: "error",
      code: "invalid-response",
      message: ERROR_MESSAGES["invalid-response"],
    };
  }

  const result = await generateWithGemini(
    buildReviewerPrompt(JSON.stringify(draft.data, null, 2)),
  );
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
