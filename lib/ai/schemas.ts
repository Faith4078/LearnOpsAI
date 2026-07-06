import { z } from "zod";

/**
 * Canonical content-bundle contract. Defined once here; every layer
 * (agents, actions, UI, and later the Sanity mapper) shares this schema
 * and its inferred type.
 */

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.string().min(1),
  explanation: z.string().min(1),
});

export const contentBundleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  article: z.string().min(1),
  faqs: z.array(faqSchema).min(1),
  quiz: z.array(quizQuestionSchema).min(1),
});

export type Faq = z.infer<typeof faqSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type ContentBundle = z.infer<typeof contentBundleSchema>;
