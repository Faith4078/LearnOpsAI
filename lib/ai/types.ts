/**
 * Shared types for the AI service layer.
 *
 * The agent layer only ever sees `AiResult` values — never provider SDK
 * types or thrown provider errors.
 */

export type AiErrorCode =
  | "missing-config"
  | "api-error"
  | "rate-limit"
  | "invalid-response";

export interface AiError {
  code: AiErrorCode;
  message: string;
}

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AiError };

/**
 * The single injection point between the AI service and the provider SDK.
 * Takes a prompt, returns the raw model text. Tests fake this function;
 * production wires it to the Gemini SDK.
 */
export type ModelCaller = (prompt: string) => Promise<string>;
