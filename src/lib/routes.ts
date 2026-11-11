import { apiPrefix } from "@metacensus/api";

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
    user: apiPrefix + "/user",

    // Topics
    topic: apiPrefix + "/topic",
    topicById: (topicId: string) => `${apiPrefix}/topic/${topicId}`,
    topicProtocol: (topicId: string) =>
      `${apiPrefix}/topic/${topicId}/protocol`,
    topicMyVotes: (topicId: string) => `${apiPrefix}/topic/${topicId}/my-votes`,
    workingSet: (topicId: string, runId: string) =>
      `${apiPrefix}/topic/${topicId}/runs/${runId}/working-set`,
    workingSetMembership: (topicId: string, runId: string) =>
      `${apiPrefix}/topic/${topicId}/runs/${runId}/working-set/membership`,

    // Taxonomy
    domain: apiPrefix + "/domain",
    category: apiPrefix + "/category",

    // Papers
    paper: apiPrefix + "/paper",
    paperAccept: (paperId: string) => `${apiPrefix}/paper/${paperId}/accept`,
    paperCreate: apiPrefix + "/paper/create",
    paperLookup: apiPrefix + "/paper/lookup",
    paperPresignedUrl: (paperId: string) =>
      `${apiPrefix}/paper/${paperId}/presigned-url`,

    // Protocols
    protocol: apiPrefix + "/protocol",
    protocolCreate: apiPrefix + "/protocol/create",
    protocolEdit: apiPrefix + "/protocol/edit",
    protocolTemplate: apiPrefix + "/protocol-template",
    protocolElement: apiPrefix + "/protocol-element",

    // Extraction
    extraction: apiPrefix + "/extraction",
    extractionCreate: apiPrefix + "/extraction/create",
    extractionEdit: apiPrefix + "/extraction/edit",
    extractionReview: apiPrefix + "/extraction-review",
    exploreQuery: apiPrefix + "/explore/query",

    // Literature search
    litSearch: apiPrefix + "/lit-search",
    litSearchAbstract: (id: string) => `${apiPrefix}/lit-search/${id}/abstract`,
  },

  // The demo's own authored data, served beside the API but outside its contract.
  demo: {
    labels: (runId: string) => `/metacensus/demo/labels/${runId}.json`,
  },
};
