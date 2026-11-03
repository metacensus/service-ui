import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import TopicDashboard from "./page";

vi.mock("@/hooks/useFetchData", () => ({
  useFetchData: (url: string) =>
    url.endsWith("/prop")
      ? { isPending: true, failureCount: 1 }
      : { isPending: false, isError: false, data: undefined },
}));
vi.mock("@/hooks/useGetUserId", () => ({
  useGetUserId: () => ({ userId: undefined }),
}));
vi.mock("@/components/shared/Link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe("TopicDashboard", () => {
  it("says the topic question is still trying while its props query retries", () => {
    const markup = renderToStaticMarkup(
      <TopicDashboard params={{ topicId: "t1" }} />
    );
    expect(markup).toContain("Still trying");
  });
});
