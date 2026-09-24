import { expect, it } from "vitest";
import { getPaperLifecycleStage, getPaperStatusCount, PAPER_LIFECYCLE_STAGES, showsWorkingSetMembership } from "./getPaperStatusCount";
import type { Paper } from "../../types/Paper";
const paper = (id: number, status: Paper["status"]): Paper => ({ id, status } as Paper);
it("counts every displayed paper once across four lifecycle columns, including historical rejection", () => {
  const papers = [paper(1, "Rejected"), paper(2, "Pending Review"), paper(3, "Being Reviewed"),
    paper(4, "Pending Approval"), paper(5, "Accepted"), paper(6, "Pending Approval")];
  const adjudicated = (p: Paper) => p.id === 6;
  expect(PAPER_LIFECYCLE_STAGES.map(stage => getPaperStatusCount([...papers, papers[0]], stage, adjudicated)))
    .toEqual([2, 1, 2, 1]);
});
it("places by stored status: Rejected and Pending Review are Gathered, Pending Approval and Accepted Extracted", () => {
  expect(getPaperLifecycleStage(paper(1, "Rejected"))).toBe("Abstracts Gathered");
  expect(getPaperLifecycleStage(paper(1, "Pending Review"))).toBe("Abstracts Gathered");
  expect(getPaperLifecycleStage(paper(1, "Being Reviewed"))).toBe("Abstracts Approved for Full-Text Review");
  expect(getPaperLifecycleStage(paper(1, "Pending Approval"))).toBe("Papers Extracted");
  expect(getPaperLifecycleStage(paper(1, "Accepted"))).toBe("Papers Extracted");
});
it("adjudication overrides stored status, independently of working-set membership", () => {
  for (const status of ["Rejected", "Pending Review", "Being Reviewed", "Pending Approval", "Accepted"] as const) {
    expect(getPaperLifecycleStage(paper(1, status), true)).toBe("Papers Adjudicated");
  }
  const completed = paper(1, "Pending Approval");
  expect(getPaperLifecycleStage({ ...completed, workingSetMembership: false } as Paper, true)).toBe("Papers Adjudicated");
  expect(getPaperLifecycleStage({ ...completed, workingSetMembership: true } as Paper, true)).toBe("Papers Adjudicated");
  expect(getPaperLifecycleStage({ ...completed, workingSetMembership: true } as Paper, false)).toBe("Papers Extracted");
});
it("keeps shared dashboard stored-status counting available", () => {
  expect(getPaperStatusCount([paper(1, "Rejected"), paper(2, "Pending Review")], "Rejected")).toBe(1);
});
it("shows working-set membership only in the Extracted and Adjudicated columns", () => {
  expect(PAPER_LIFECYCLE_STAGES.map(showsWorkingSetMembership)).toEqual([false, false, true, true]);
});
it("decides membership visibility from the board's placement, not the stored status", () => {
  const storedGathered = paper(1, "Pending Review");
  expect(showsWorkingSetMembership(getPaperLifecycleStage(storedGathered, false))).toBe(false);
  expect(getPaperLifecycleStage(storedGathered, true)).toBe("Papers Adjudicated");
  expect(showsWorkingSetMembership(getPaperLifecycleStage(storedGathered, true))).toBe(true);
  expect(showsWorkingSetMembership(getPaperLifecycleStage(paper(2, "Being Reviewed"), false))).toBe(false);
  expect(showsWorkingSetMembership(getPaperLifecycleStage(paper(3, "Accepted"), false))).toBe(true);
});
