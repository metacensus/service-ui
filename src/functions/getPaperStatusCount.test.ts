import { expect, it } from "vitest";
import type { Paper } from "../../types/Paper";
it("counts every displayed paper once across four lifecycle columns, including historical rejection", () => {
  const papers = [paper(1, "Rejected"), paper(2, "Pending Review"), paper(3, "Being Reviewed"),
});
});
it("keeps shared dashboard stored-status counting available", () => {
  expect(getPaperStatusCount([paper(1, "Rejected"), paper(2, "Pending Review")], "Rejected")).toBe(1);
});
