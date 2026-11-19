import type { TopicRecord } from "@metacensus/api";

/** Fields the contract's Topic lacks; the Client never fills them. #11 drops domain and categories; the rest wait on the contract. */
export type Topic = TopicRecord & {
  question?: string;
  status?: string;
  domain?: { name: string; id: number };
  topicCategories?: { category: { name: string; id: number } }[];
  topicReviewers?: { reviewer: { name: string; id: number } }[];
  topicAdmins?: { admin: { name: string; id: number } }[];
  topicContributors?: {
    contributor: { name: string; id: number; role: string };
  }[];
};
