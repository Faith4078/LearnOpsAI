````text
You are a senior Staff Software Engineer at Harvey AI.

Your task is to build a production-quality MVP called **LearnOps AI**.

The application demonstrates an AI-powered customer education and knowledge operations platform that automates documentation publishing workflows.

The goal is to showcase production-ready AI agents, LLM workflows, automation pipelines, and Sanity CMS integration—not just AI content generation.

---

# Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Google Gemini API (gemini-2.5-flash)
- Sanity CMS
- React Hook Form
- Zod
- Server Actions or Route Handlers
- GROQ
- next-sanity

Use strict TypeScript.

Use reusable components.

Use clean architecture.

Everything must be production-ready.

---

# AI Provider

Use **Google Gemini API** with the free-tier model:

**gemini-2.5-flash**

There should only be **two AI calls** for the complete workflow.

1. Generator Agent
2. Review Agent

Do NOT create separate API calls for FAQ generation, quiz generation, article generation, etc.

The Generator Agent should generate everything in a single structured response.

The Review Agent should review everything in one structured response.

This keeps the architecture scalable and efficient.

---

# AI Architecture

Create a reusable AI abstraction.

Folder structure:

/lib/ai

    gemini.ts
    prompts.ts
    schemas.ts
    types.ts
    index.ts

The shared AI service should handle:

- Gemini initialization
- Model configuration
- Structured JSON generation
- Error handling
- Retry logic
- Rate limit handling
- Response validation

Every AI agent should simply call:

generateWithGemini(prompt)

without knowing implementation details.

This architecture should make it easy to swap Gemini for OpenAI or Claude in the future.

---

# Design System

Use the provided Harvey Design.md as the single source of truth.

Follow its:

- typography
- spacing
- color palette
- card styles
- layouts
- buttons
- animations
- iconography
- border radius
- shadows

Do not invent another design language.

The application should resemble a polished enterprise SaaS product.

---

# Project Goal

Users upload documentation.

The application automatically:

1. Generates a Help Center Article
2. Generates Frequently Asked Questions
3. Generates a Knowledge Check Quiz
4. Reviews all generated content using an AI Review Agent
5. Publishes approved content to Sanity CMS
6. Automatically displays published content in a searchable Help Center

This should feel like an internal customer education platform.

---

# User Workflow

Upload Documentation

↓

Generator Agent

↓

Review Agent

↓

Publish to Sanity

↓

Help Center Automatically Updates

---

# Features

## 1. Upload Documentation

Allow users to:

- Upload Markdown
- Upload TXT
- Paste documentation manually

Create a clean abstraction for future PDF support.

---

## 2. Generator Agent

Use ONE Gemini API request.

Prompt the model to return structured JSON.

Return:

{
"title":"",
"slug":"",
"summary":"",
"article":"",
"faqs":[
{
"question":"",
"answer":""
}
],
"quiz":[
{
"question":"",
"options":[],
"answer":"",
"explanation":""
}
]
}

Generate:

- Help Center Article
- FAQ
- Quiz

Everything should come from ONE AI request.

---

## 3. Review Agent

Use ONE Gemini API request.

Input:

The complete generated JSON.

Responsibilities:

- Improve clarity
- Remove repetition
- Improve headings
- Improve formatting
- Improve article flow
- Verify quiz quality
- Improve beginner friendliness
- Ensure consistency

Return the improved JSON.

---

## 4. Publish to Sanity

Create a Help Article schema.

Fields:

- title
- slug
- summary
- article
- faqs
- quiz
- publishedAt

Create a Publish button.

Publishing should save the reviewed content into Sanity.

---

## 5. Help Center

Create:

/help-center

Fetch articles from Sanity.

Display:

- Search
- Cards
- Summary
- Publish date

Each article links to:

/help-center/[slug]

Article page displays:

- Title
- Summary
- Full article
- FAQ
- Quiz

Publishing to Sanity should automatically make articles available.

No manual updates.

---

# UI

Use shadcn/ui.

Create an enterprise dashboard.

Pages:

Home

Help Center

Article

Components:

- Upload Card
- Progress Timeline
- AI Agent Status
- Result Cards
- Publish Button
- Success Toast
- Error Toast
- Loading Skeletons

Everything should be responsive.

---

# Agent Timeline

Display the workflow visually.

Example:

📄 Documentation Uploaded

↓

🤖 Generator Agent

↓

📝 Review Agent

↓

🚀 Publishing Agent

↓

📚 Help Center Updated

Each step should animate as it completes.

---

# Folder Structure

/app

/components

/components/upload

/components/help-center

/components/agents

/components/layout

/lib

/lib/ai

/lib/sanity

/lib/prompts

/lib/types

/actions

/hooks

/utils

/sanity

/public

Separate concerns.

Avoid large files.

---

# API Functions

Create reusable functions.

generateContent()

reviewContent()

publishToSanity()

fetchArticles()

Keep responsibilities isolated.

---

# Error Handling

Handle:

- Empty uploads
- Invalid Gemini responses
- API failures
- Rate limits
- Invalid JSON
- Missing environment variables
- Sanity failures

Display meaningful user-friendly messages.

---

# README

Generate a professional README.

Include:

- Overview
- Features
- Architecture
- Workflow Diagram
- Folder Structure
- Tech Stack
- Setup
- Environment Variables
- Future Improvements

---

# Future Improvements

Mention:

- Claude support
- OpenAI support
- Multi-agent orchestration
- ElevenLabs narration
- Skilljar LMS integration
- AI content governance
- Content freshness monitoring
- Scheduled review agents
- Semantic search
- Version-aware documentation updates
- Analytics dashboard
- Human approval workflows

---

# Code Quality

Assume this project is being reviewed by senior engineers at Harvey.

Prioritize:

- Clean architecture
- Excellent TypeScript
- Reusable components
- Strong abstractions
- Accessibility
- Production-ready folder organization
- Maintainability
- Scalability

Avoid shortcuts.

Avoid monolithic files.

Every architectural decision should be suitable for a real enterprise SaaS application.

Build this as if it were a portfolio project that demonstrates the exact skills Harvey looks for in an Automation Engineer.
```
````
