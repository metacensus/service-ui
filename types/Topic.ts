export type Topic = {
  id: string;
  created: string;
  name: string;
  topicCategories: { category: { name: string; id: number } }[];
  topicReviewers: { reviewer: { name: string; id: number } }[];
  status: string;
  statusDescription: string;
  topicAdmins: { admin: { name: string; id: number } }[];
  domain: { name: string; id: number };
  topicContributors: {
    contributor: { name: string; id: number; role: string };
  }[];
  description: string;
  question: string;
  minimumExtractionReviews: number;
};
