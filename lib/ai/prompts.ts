/**
 * Prompt builders for the AI agents. Pure functions of their inputs —
 * no provider or transport concerns.
 */

export function buildGeneratorPrompt(documentation: string): string {
  return `You are the Generator Agent for LearnOps AI, an internal customer-education platform.

Transform the raw product documentation below into a complete, publish-ready education bundle.

Respond with ONLY a single JSON object — no markdown fences, no commentary — matching exactly this shape:
{
  "title": "string — a clear, customer-facing article title",
  "slug": "string — URL-safe kebab-case slug derived from the title",
  "summary": "string — 2-3 sentence overview of the article",
  "article": "string — the full help-center article in Markdown, with headings, written for beginners",
  "faqs": [{ "question": "string", "answer": "string" }],
  "quiz": [{ "question": "string", "options": ["string", "..."], "answer": "string — must be one of the options verbatim", "explanation": "string — why the answer is correct" }]
}

Requirements:
- Write for customers who have never seen this product before.
- Produce 4-6 FAQs covering the most likely customer questions.
- Produce 3-5 quiz questions, each with exactly 4 options and one correct answer.
- Base everything strictly on the documentation; do not invent features.

Documentation:
"""
${documentation}
"""`;
}
