/**
 * `helpArticle` document schema definition.
 *
 * Written as a plain schema-definition object (the shape Sanity Studio's
 * `schema.types` array consumes) so an embedded or standalone Studio can
 * import it directly without this repo depending on the full `sanity`
 * package.
 */
export const helpArticle = {
  name: "helpArticle",
  title: "Help Article",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    },
    { name: "summary", title: "Summary", type: "text", rows: 3 },
    {
      name: "article",
      title: "Article (Markdown)",
      type: "text",
      rows: 20,
    },
    {
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [
        {
          type: "object",
          name: "faq",
          title: "FAQ",
          fields: [
            { name: "question", title: "Question", type: "string" },
            { name: "answer", title: "Answer", type: "text", rows: 3 },
          ],
        },
      ],
    },
    {
      name: "quiz",
      title: "Quiz",
      type: "array",
      of: [
        {
          type: "object",
          name: "quizQuestion",
          title: "Quiz Question",
          fields: [
            { name: "question", title: "Question", type: "string" },
            {
              name: "options",
              title: "Options",
              type: "array",
              of: [{ type: "string" }],
            },
            { name: "answer", title: "Correct Answer", type: "string" },
            {
              name: "explanation",
              title: "Explanation",
              type: "text",
              rows: 2,
            },
          ],
        },
      ],
    },
    { name: "publishedAt", title: "Published At", type: "datetime" },
  ],
} as const;
