"use server";

import {
  buildReviewerPrompt,
  contentBundleSchema,
  generateWithGemini,
  reviewResponseSchema,
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

type ReviewErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * How many times the Review Agent re-attempts a review when the model
 * returns unusable output (malformed JSON, or content that fails the
 * review schema). This is autonomous recovery from a flaky generation —
 * distinct from, and layered on top of, the transport-level retries that
 * `generateWithGemini` already performs for transient network failures.
 */
const MAX_REVIEW_ATTEMPTS = 3;

/**
 * Review Agent: takes the Generator Agent's complete bundle and, in a
 * single Gemini call, improves clarity, structure, and quiz quality AND
 * produces the Quality Assurance Report (score, changes made, publishing
 * recommendation).
 *
 * When the model returns unusable output, the review is re-attempted up to
 * `MAX_REVIEW_ATTEMPTS` times without any human intervention; only if every
 * attempt fails does the failure surface. Transport failures (api-error,
 * rate-limit) are already retried inside `generateWithGemini` and
 * missing-config is terminal, so those short-circuit rather than
 * re-prompting. Never throws — every failure maps to a typed error the UI
 * can render.
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

  const prompt = buildReviewerPrompt(JSON.stringify(draft.data, null, 2));

  let lastError: ReviewErrorCode = "invalid-response";
  for (let attempt = 0; attempt < MAX_REVIEW_ATTEMPTS; attempt += 1) {
    const result = await generateWithGemini(prompt);
    if (!result.ok) {
      lastError = result.error.code;
      // Only unusable model output is worth re-prompting. Transport errors
      // are already retried with backoff inside generateWithGemini, and
      // missing-config is terminal — re-prompting those would not help.
      if (result.error.code !== "invalid-response") break;
      continue;
    }

    const parsed = reviewResponseSchema.safeParse(result.data);
    if (parsed.success) {
      return {
        status: "success",
        bundle: parsed.data.bundle,
        report: parsed.data.reviewReport,
      };
    }

    // Well-formed JSON that does not match the review schema — re-prompt.
    lastError = "invalid-response";
  }

  return { status: "error", code: lastError, message: ERROR_MESSAGES[lastError] };
}
