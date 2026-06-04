export type ConsensusStatement = {
  id: string;
  description: string;
  statement: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  topicId: string;
  status: string;
};
