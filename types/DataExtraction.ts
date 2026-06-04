export type SourceRect = { x: number; y: number; w: number; h: number };
export type SourceLocation = { page: number; rects: SourceRect[] }[];

export type DataExtraction = {
  id: number;
  paperId: number;
  protocolId: number;
  protocolElementId: number;
  userId: number;
  dataExtractionReviewId: number;
  data: string;
  sourceLocation: SourceLocation | null;
  createdAt: string;
  updatedAt: string;
};
