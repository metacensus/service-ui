export type Paper = {
  id: number;
  title: string;
  authors: string[];
  abstract: string;
  status: PaperStatus;
  topicId: string;
  domain: string;
  doi: string;
  pmid: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  s3Key: string;
  fullTextUrl: string;
  paperContributors: { contributor: { name: string; id: number } }[];
  description: string;
  paperApprovalsRejections: {
    approval: boolean;
    createdAt: string;
    user: {
      name: string;
      id: number;
    };
  }[];
};

export type PaperStatus =
  | "Pending Review"
  | "Being Reviewed"
  | "Pending Approval"
  | "Rejected"
  | "Accepted";
