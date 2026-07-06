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

/** Error codes a review run can surface to the UI. */
export type ReviewContentErrorCode =
  | "invalid-response"
  | "api-error"
  | "missing-config";

/** Discriminated union returned by the `reviewContent` server action. */
export type ReviewContentResult =
  | { status: "success"; bundle: ContentBundle }
  | { status: "error"; code: ReviewContentErrorCode; message: string };

/** Error codes a publish run can surface to the UI. */
export type PublishContentErrorCode =
  | "invalid-response"
  | "missing-config"
  | "sanity-error";

/** Discriminated union returned by the `publishToSanity` server action. */
export type PublishContentResult =
  | { status: "success"; slug: string }
  | { status: "error"; code: PublishContentErrorCode; message: string };

/** Stages of the client-side content pipeline (issues #2, #3). */
export type PipelineStage =
  | "idle"
  | "generating"
  | "reviewing"
  | "done"
  | "publishing"
  | "published"
  | "error";

/** Pipeline stages that can fail and be pinned on the Agent Timeline. */
export type FailedStage = "generating" | "reviewing" | "publishing";
