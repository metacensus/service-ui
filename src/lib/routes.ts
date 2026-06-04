// Single backend URL surface. Every backend call the UI makes goes through
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

    // Taxonomy

    // Papers
    paperPresignedUrl: (paperId: string) =>

    // Protocols

    // Extraction

    // Literature search
  },
};
