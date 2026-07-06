# PRD: LearnOps AI — AI-Powered Documentation Publishing Platform

**Status:** ready-for-agent
**Source:** client-brief.md
**Date:** 2026-07-06

## Problem Statement

Customer education teams receive raw product documentation (Markdown, plain text) and must manually turn it into customer-facing learning material: a polished help article, a FAQ, and a knowledge-check quiz. This is slow, inconsistent, and requires a second editorial pass before anything can be published. Publishing is a separate manual step, and keeping the customer-facing Help Center in sync with newly approved content requires manual updates.

## Solution

LearnOps AI is an internal customer-education platform that automates the full documentation-to-publication pipeline. A user uploads or pastes documentation; a **Generator Agent** (one Gemini call) produces a structured bundle — help article, FAQs, and quiz — in a single response; a **Review Agent** (one Gemini call) editorially improves the whole bundle; the user publishes the approved bundle to Sanity CMS with one click; and the public **Help Center** automatically reflects published content with search, article pages, FAQs, and quizzes. A visual Agent Timeline shows each pipeline stage animating as it completes.

## User Stories

1. As a content operator, I want to upload a Markdown file, so that I can start the content pipeline from existing documentation.
2. As a content operator, I want to upload a TXT file, so that I can use plain-text documentation without conversion.
3. As a content operator, I want to paste documentation directly into a text area, so that I can process content that isn't saved as a file.
4. As a content operator, I want an error message when I submit empty or whitespace-only input, so that I don't waste an AI call on nothing.
5. As a content operator, I want unsupported file types rejected with a clear message, so that I understand what formats are accepted.
6. As a content operator, I want the Generator Agent to produce a help article, FAQs, and a quiz from one submission, so that I get a complete education package without multiple steps.
7. As a content operator, I want the generated bundle to include a title, slug, and summary, so that the content is publish-ready metadata-wise.
8. As a content operator, I want the Review Agent to automatically improve the generated content's clarity, structure, and beginner-friendliness, so that published material meets editorial standards without manual editing.
9. As a content operator, I want to see both stages run as a visual timeline (Uploaded → Generator Agent → Review Agent → Publishing → Help Center Updated), so that I know exactly where my content is in the pipeline.
10. As a content operator, I want each timeline step to animate as it completes, so that I get clear feedback that progress is happening.
11. As a content operator, I want to preview the reviewed article, FAQs, and quiz in result cards before publishing, so that I can verify quality before customers see it.
12. As a content operator, I want a Publish button that saves the reviewed bundle to Sanity, so that approved content goes live in one action.
13. As a content operator, I want a success toast after publishing, so that I know the content is live.
14. As a content operator, I want an error toast with a human-readable message when generation, review, or publishing fails, so that I know what went wrong and can retry.
15. As a content operator, I want the system to retry transient AI failures and rate limits automatically, so that momentary Gemini issues don't force me to restart the pipeline.
16. As a content operator, I want invalid or malformed AI responses caught and reported instead of shown raw, so that I never see broken JSON as content.
17. As a content operator, I want loading skeletons and agent-status indicators while AI calls run, so that the app feels responsive during long operations.
18. As a help-center visitor, I want a /help-center page listing published articles as cards with title, summary, and publish date, so that I can browse available help content.
19. As a help-center visitor, I want to search articles by keyword, so that I can quickly find content relevant to my question.
20. As a help-center visitor, I want each card to link to /help-center/[slug], so that I can read the full article.
21. As a help-center visitor, I want the article page to show the title, summary, and full formatted article body, so that I can learn the topic in depth.
22. As a help-center visitor, I want the FAQs displayed on the article page, so that common questions are answered without reading the whole article.
23. As a help-center visitor, I want an interactive knowledge-check quiz with options, correct answers, and explanations, so that I can verify my understanding.
24. As a help-center visitor, I want newly published articles to appear in the Help Center automatically, so that I always see the latest content with no manual refresh of the catalog.
25. As a help-center visitor, I want the Help Center to work well on mobile, so that I can read help content on any device.
26. As a developer, I want all AI calls routed through a single generateWithGemini abstraction, so that swapping Gemini for OpenAI or Claude later touches one module.
27. As a developer, I want AI responses validated against Zod schemas before use, so that downstream code can trust the content shape.
28. As a developer, I want exactly two AI calls per pipeline run (generate, review), so that the architecture stays efficient within free-tier limits.
29. As a developer, I want a documented content-source abstraction for uploads, so that PDF support can be added later without reworking the upload flow.
30. As a developer, I want missing environment variables (Gemini key, Sanity project config) detected at startup/first-use with clear errors, so that misconfiguration is obvious.
31. As a developer, I want Sanity write failures surfaced distinctly from AI failures, so that operators know which system to check.
32. As a stakeholder, I want the UI to follow the Harvey design system (harvey.ai-design.md) exactly, so that the product looks like a polished enterprise SaaS.
33. As a stakeholder, I want a professional README with architecture, workflow diagram, setup, and env vars, so that reviewers can run and evaluate the project quickly.
34. As a user relying on assistive technology, I want forms, buttons, toasts, and the quiz to be accessible (labels, focus states, ARIA where needed), so that I can operate the full workflow.

## Implementation Decisions

- **Two AI calls only.** The Generator Agent produces the entire content bundle (title, slug, summary, article, faqs[], quiz[]) in one structured-JSON Gemini request; the Review Agent takes the full bundle and returns an improved bundle in one request. No per-artifact AI calls.
- **Model/provider:** Google Gemini `gemini-2.5-flash` via a shared AI service in a dedicated AI module exposing `generateWithGemini(prompt)`. The service owns client initialization, model config, structured JSON generation, JSON extraction/parsing, Zod validation, retry with backoff, rate-limit handling, and typed error results. Agents know nothing about the provider — this is the provider-swap boundary.
- **Content bundle schema (from the brief, treated as the canonical contract):**
  ```json
  {
    "title": "", "slug": "", "summary": "", "article": "",
    "faqs": [{ "question": "", "answer": "" }],
    "quiz": [{ "question": "", "options": [], "answer": "", "explanation": "" }]
  }
  ```
  Defined once as a Zod schema with the TypeScript type inferred from it; both agents and the Sanity mapper share it.
- **Actions layer as the application API:** four server-side functions — `generateContent()`, `reviewContent()`, `publishToSanity()`, `fetchArticles()` — implemented as Server Actions / route handlers. All UI goes through these; no component talks to Gemini or Sanity directly.
- **Sanity:** a `helpArticle` document type with fields title, slug, summary, article, faqs, quiz, publishedAt. Reads via GROQ with next-sanity; writes via an authenticated client used only server-side. Help Center list and article pages fetch from Sanity at request time (or with revalidation) so publishing makes content appear without manual steps.
- **Upload abstraction:** a content-source interface that normalizes .md files, .txt files, and pasted text into a single documentation string, designed so a PDF extractor can be added as another source later.
- **Routes:** Home (dashboard with upload + pipeline), `/help-center` (searchable card list), `/help-center/[slug]` (article + FAQ + quiz). Search filters client-side over fetched article metadata.
- **Pipeline state and Agent Timeline:** the client orchestrates the stages sequentially (upload → generate → review → publish), holding a pipeline status state that drives the animated timeline and agent-status components; each stage transition maps to one action call.
- **Error model:** actions return typed success/error results (not thrown strings) covering empty input, invalid AI JSON, API failure, rate limit, missing env vars, and Sanity failure; the UI maps each to a friendly toast message.
- **Stack constraints:** strict TypeScript, shadcn/ui components, Tailwind, React Hook Form + Zod for the upload form, folder structure per the brief (app / components by feature / lib/ai / lib/sanity / actions / hooks / utils / sanity studio config). Note: the scaffold is on Next 16 (brief says 15) — build against what's installed.
- **Design:** harvey.ai-design.md is the single source of truth for typography, color, spacing, and components; no new design language.
- **README** covering overview, features, architecture, workflow diagram, folder structure, tech stack, setup, env vars, and the future-improvements list from the brief.

## Testing Decisions

- Tests exercise **external behavior only**: given documentation in, assert the shape and handling of the bundle out; never assert prompt wording, internal call order, or private helpers.
- **Primary seam — the actions layer.** `generateContent()`, `reviewContent()`, `publishToSanity()`, and `fetchArticles()` are tested end-to-end with the Gemini client and Sanity client faked at their single injection points. This covers prompt-to-bundle flow, Zod validation, slug/metadata presence, publish mapping, and typed error results (empty input, invalid JSON, rate limit, Sanity failure).
- **Supporting seam — `generateWithGemini(prompt)`.** The one place the raw provider is faked, covering retry/backoff, rate-limit handling, malformed-JSON recovery, and missing-env-var errors without network access.
- No UI component tests; the UI is a thin layer over the actions.
- Prior art: none — this is a greenfield repo; these tests establish the pattern (Vitest or similar, fakes injected at module boundaries, no network in tests).

## Out of Scope

- PDF upload (abstraction prepared, extractor not built)
- Authentication, roles, or multi-tenant workspaces
- Human approval workflows beyond the single preview-then-publish step
- OpenAI/Claude providers, multi-agent orchestration, ElevenLabs narration, Skilljar LMS integration, semantic search, content-freshness monitoring, scheduled review agents, version-aware doc updates, analytics dashboards (all listed as future improvements in the README only)
- Editing published articles from within the app; quiz score persistence

## Further Notes

- Gemini free tier has tight rate limits; the retry/rate-limit handling in the AI service is load-bearing, not decorative.
- The slug generated by the AI should be normalized/deduplicated defensively before publishing so Sanity slugs stay unique and URL-safe.
- The Agent Timeline shows a "Publishing Agent" step for presentation, but publishing is a plain Sanity write, not a third AI call — keep the two-call constraint intact.
