import { expect, it, vi } from "vitest";

vi.mock("@/hooks/useFetchData", () => ({ fetchData: vi.fn() }));

import type { Paper } from "../../types/Paper";
import { fetchAllTopicPapers } from "./fetchAllTopicPapers";

const papers = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: from + i }) as Paper);

it("pages until a short page, so the grid gets every paper once", async () => {
  const pages: Record<number, Paper[]> = { 1: papers(1, 100), 2: papers(101, 100), 3: papers(200, 7) };
  const fetchPage = vi.fn(async ({ page }: { page: number }) => pages[page] ?? []);
  const all = await fetchAllTopicPapers("topc:t", fetchPage);
  expect(fetchPage.mock.calls.map(([body]) => body)).toEqual([
    { topicId: "topc:t", page: 1, limit: 100 },
    { topicId: "topc:t", page: 2, limit: 100 },
    { topicId: "topc:t", page: 3, limit: 100 },
  ]);
  expect(all).toHaveLength(206); // paper 200 appears on two pages
  expect(new Set(all.map((p) => p.id)).size).toBe(206);
});

it("43 papers are one request", async () => {
  const fetchPage = vi.fn(async () => papers(1, 43));
  expect(await fetchAllTopicPapers("topc:t", fetchPage)).toHaveLength(43);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});
