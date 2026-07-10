import { defineCliConfig } from 'sanity/cli';

/**
 * Sanity CLI configuration: lets `npx sanity ...` commands (schema
 * deploy, cors, etc.) run from the repo root. The project id is public
 * (it already ships to the browser via NEXT_PUBLIC_*).
 */
export default defineCliConfig({
  api: {
    projectId: 'st22tqwy',
    dataset: 'production',
  },
  deployment: {
    appId: 'i930hgl5cny97uv3m147xsn6',
    // Remove or leave appId empty so a new one gets generated on deploy
    autoUpdates: true,
  },
});
