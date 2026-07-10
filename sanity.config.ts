'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './sanity';

/**
 * Embedded Sanity Studio configuration, served by the Next.js app at
 * /studio. Uses the same project/dataset the app reads and publishes to.
 */
export default defineConfig({
  name: 'knowledgeopsai',
  title: 'KnowledgeOps AI — Knowledge Base',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
