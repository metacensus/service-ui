// Single backend URL surface. Every backend call the UI makes goes through
// `/metacensus/api/v1/*` as a relative path; the reverse proxy in front of the
// SPA is what routes that prefix to whichever API backs the environment. This
// image never proxies to an API itself, which is what lets one build run
// everywhere.
//
// Naming follows the production backend convention: SINGULAR resource nouns
// (`/topic`, `/user`, `/paper`, `/domain`, …), collection ops on the noun, and
// nested sub-resources under their parent. When you add a backend call, add its
// path here (singular) and reference it via `routes.api.*` — never hardcode a
// path string at the callsite.

export const routes = {
  api: {
    // Auth / identity

    // Topics
    workingSet: (topicId: string, runId: string) =>
    workingSetMembership: (topicId: string, runId: string) =>

    // Taxonomy

    // Papers
    paperPresignedUrl: (paperId: string) =>

    // Protocols

    // Extraction

    // Literature search
  },
};
