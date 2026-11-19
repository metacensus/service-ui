import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import TopicDashboard from "./page";

vi.mock("@/hooks/useFetchData", () => ({
  useFetchData: () => ({ isPending: false, isError: false, data: undefined }),
}));
vi.mock("@/hooks/useProps", () => ({
  useProps: () => ({ isPending: true, failureCount: 1 }),
  useVotes: () => ({ isPending: true, failureCount: 0 }),
}));
vi.mock("@/hooks/useTopics", () => ({
  useTopics: () => ({ isPending: false, isError: false, data: [] }),
  useMembers: () => ({ data: undefined }),
}));
vi.mock("@/hooks/useGetUserId", () => ({
  useGetUserId: () => ({ userId: undefined }),
}));
vi.mock("@/features/reviewer-workspace/hooks/useExtractionSummary", () => ({
  useExtractionSummary: () => ({ isPending: true, isError: false }),
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
    expect(markup).not.toContain("No scientific question");
  });
});
