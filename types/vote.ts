export type Vote = {
  position: "For" | "Against" | "Abstain";
  explanation: string;
  lastCast: string;
  citations?: {
    start: number;
    end: number;
  }[];
  userId: string;
  propId: string;
};
