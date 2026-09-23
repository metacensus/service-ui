import { describe, expect, it } from "vitest";
import {
  findVoteForUser,
  isPropVoteClosed,
  sameEntityId,
} from "./entityId";

describe("sameEntityId", () => {
  it("equates number and string forms", () => {
    expect(sameEntityId(1, "1")).toBe(true);
    expect(sameEntityId("2", 2)).toBe(true);
  });

  it("rejects distinct ids", () => {
    expect(sameEntityId(1, "10")).toBe(false);
    expect(sameEntityId("1", "11")).toBe(false);
  });
});

describe("findVoteForUser", () => {
  const votes = [
    { userId: "1", position: "For" as const },
    { userId: "10", position: "Against" as const },
  ];

  it("matches the exact user, not a substring", () => {
    expect(findVoteForUser(votes, "1")?.position).toBe("For");
    expect(findVoteForUser(votes, "10")?.position).toBe("Against");
  });

  it("does not treat user 1 as matching user 10", () => {
    // The prior `vote.userId.includes(userId)` would return user 10 here.
    expect(findVoteForUser(votes, "1")?.userId).toBe("1");
  });
});

describe("isPropVoteClosed", () => {
  it("stays open when conclusion is open even if concluded is set", () => {
    expect(
      isPropVoteClosed({ concluded: "2026-01-01T00:00:00.000Z", conclusion: "open" })
    ).toBe(false);
  });

  it("closes on passed/failed/expired with a concluded timestamp", () => {
    expect(
      isPropVoteClosed({ concluded: "2026-01-01T00:00:00.000Z", conclusion: "passed" })
    ).toBe(true);
  });
});
