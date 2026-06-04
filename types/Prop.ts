export type Prop = {
  authorId: string;
  created: string; // ISO date string
  description: string;
  id: string;
  type:
    | "Statement"
    | "TopicQuestion"
    | "TopicChange"
    | "UserAdmit"
    | "UserExpulse"
    | "PaperExtractionComplete"
    | "PaperIncludeMetaAnalysis"; // Enum string
  concluded: string; // ISO date string
  conclusion: "open" | "passed" | "failed" | "expired"; // Enum string
};
