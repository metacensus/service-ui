import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import Dashboard from "./page";

vi.mock("@/hooks/useFetchData", () => ({
  useFetchData: () => ({ isPending: true, failureCount: 1 }),
}));
vi.mock("@/hooks/useTopics", () => ({
  useTopics: () => ({ isPending: true, failureCount: 1 }),
}));
vi.mock("@/hooks/useGetUserId", () => ({
  useSelf: () => ({ isPending: true, failureCount: 1 }),
}));

describe("Dashboard", () => {
  it("says each section is still trying while its query retries", () => {
    const markup = renderToStaticMarkup(<Dashboard />);
    expect(markup.match(/Still trying/g)).toHaveLength(3);
  });
});
