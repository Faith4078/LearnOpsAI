/**
 * Application-level shared types.
 */

export type {
  ContentBundle,
  Faq,
  QuizQuestion,
} from "@/lib/ai/schemas";

/** Error codes a content-generation run can surface to the UI. */
export type GenerateContentErrorCode =
  | "empty-input"
  | "invalid-response"
  | "api-error"
  | "missing-config";

import type { ContentBundle } from "@/lib/ai/schemas";

/** Discriminated union returned by the `generateContent` server action. */
export type GenerateContentResult =
  | { status: "success"; bundle: ContentBundle }
  | { status: "error"; code: GenerateContentErrorCode; message: string };
