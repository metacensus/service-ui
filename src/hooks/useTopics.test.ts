import { describe, expect, it, vi } from "vitest";

const { listMembers, getUser } = vi.hoisted(() => ({
  listMembers: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/lib/apiClient", () => ({ apiClient: { listMembers, getUser } }));

import { membersQuery } from "./useTopics";

describe("membersQuery", () => {
  it("names each member from its user", async () => {
    listMembers.mockResolvedValue([
      { id: "user:a", joined: "2026-01-01T00:00:00Z" },
      { id: "user:b" },
    ]);
    getUser.mockImplementation(async ({ userId }: { userId: string }) => ({
      id: userId,
      name: userId === "user:a" ? "Ada" : "Ben",
    }));

    const { queryFn } = membersQuery("topic:1");
    const members = await (queryFn as () => Promise<unknown>)();

    expect(listMembers).toHaveBeenCalledWith({ topicId: "topic:1" });
    expect(members).toEqual([
      { id: "user:a", joined: "2026-01-01T00:00:00Z", name: "Ada" },
      { id: "user:b", name: "Ben" },
    ]);
  });
});
