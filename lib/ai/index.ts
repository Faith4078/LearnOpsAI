export { generateWithGemini, setModelCaller } from "./gemini";
export { buildGeneratorPrompt } from "./prompts";
export {
  contentBundleSchema,
  faqSchema,
  quizQuestionSchema,
  type ContentBundle,
  type Faq,
  type QuizQuestion,
} from "./schemas";
export type { AiError, AiErrorCode, AiResult, ModelCaller } from "./types";
