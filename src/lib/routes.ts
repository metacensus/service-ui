import { apiPrefix } from "@metacensus/api";

// Single backend URL surface. Every backend call the UI makes goes through
// `/metacensus/api/v1/*` as a relative path; the reverse proxy in front of the
// SPA is what routes that prefix to whichever API backs the environment. This
// image never proxies to an API itself, which is what lets one build run
// everywhere.
//
// Paths the generated Client doesn't serve yet; each leaves when
// metacensus/api declares its route.

export const routes = {
  api: {
    // Topics
    topicProtocol: (topicId: string) =>
      `${apiPrefix}/topic/${topicId}/protocol`,
    topicMyVotes: (topicId: string) => `${apiPrefix}/topic/${topicId}/my-votes`,
    workingSet: (topicId: string, runId: string) =>
      `${apiPrefix}/topic/${topicId}/runs/${runId}/working-set`,
    workingSetMembership: (topicId: string, runId: string) =>
      `${apiPrefix}/topic/${topicId}/runs/${runId}/working-set/membership`,

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
