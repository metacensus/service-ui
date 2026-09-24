// the API's shape; the one-exclusion and all-excluded reads are built
// from it in test code.

import { describe, expect, it, vi } from "vitest";
import { routes } from "@/lib/routes";
import {
  activePaperIds,
  fetchWorkingSet,
  saveWorkingSetMembership,
  saveWorkingSetMemberships,
  validateWorkingSet,
  withSavedMembership,
  WorkingSetReadError,
  WorkingSetSaveError,
  type WorkingSet,
  type WorkingSetMember,
} from "./workingSet";

const EXPECTED_PATH = `/metacensus/api/v1/topic/${TOPIC}/runs/${RUN}/working-set`;

function allActiveRead(): WorkingSet {
}

/** One manual exclusion at revision 1. */
function oneExclusionRead(): WorkingSet {
  const state = allActiveRead();
  return {
    ...state,
    revision: 1,
    members: state.members.map((member) =>
        ? {
            ...member,
            membership: "excluded",
            decision_origin: "manual",
            actor: "demo-reviewer-1",
            changed_at: "2026-09-21T12:04:00.000Z",
          }
        : member
    ),
    history: [
      {
        revision: 1,
        previous_membership: "active",
        new_membership: "excluded",
        origin: "manual",
        actor: "demo-reviewer-1",
        changed_at: "2026-09-21T12:04:00.000Z",
      },
    ],
  };
}

/** Every paper excluded. */
function allExcludedRead(): WorkingSet {
  const state = allActiveRead();
  return {
    ...state,
    members: state.members.map((member) => ({ ...member, membership: "excluded" as const })),
  };
}

type Reply = { status: number; body: unknown };

function stubFetch(...replies: Reply[]) {
  const calls: Array<{ url: string; init?: RequestInit; body?: Record<string, unknown> }> = [];
  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const { status, body } = replies[calls.length - 1];
    return { ok: status >= 200 && status < 300, status, statusText: "", json: async () => body } as Response;
  });
  return { calls, fetchFn };
}

describe("working set read", () => {
    const state = allActiveRead();
    expect(state.revision).toBe(0);
    const active = activePaperIds(state);
    expect(active).toEqual(state.members.map((member) => member.paper_id));
  });

    const active = activePaperIds(oneExclusionRead());
  });

    expect(activePaperIds(allExcludedRead())).toEqual([]);
  });

  it("issues exactly one GET to routes.api.workingSet with the auth headers", async () => {
    const state = allActiveRead();
    const { calls, fetchFn } = stubFetch({ status: 200, body: state });
    const headers = { Authorization: "Bearer test-token" };
    const read = await fetchWorkingSet(TOPIC, RUN, { fetchFn, headers });
    expect(read).toEqual(state);
    // Exactly one request, GET, to the working-set route.
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].init?.method).toBe("GET");
    expect(calls[0].url).toBe(routes.api.workingSet(TOPIC, RUN));
    expect(calls[0].url).toBe(EXPECTED_PATH);
    expect(calls[0].init?.headers).toBe(headers);
    // No request other than that single GET was made.
    expect(calls.every((call) => call.init?.method === "GET")).toBe(true);
  });

  it("a 404 or 500 rejects with the status and returns no fallback list", async () => {
    for (const status of [404, 500]) {
      const { fetchFn } = stubFetch({ status, body: { error: "wrong_run" } });
      const failure = await fetchWorkingSet(TOPIC, RUN, {
        fetchFn,
        headers: {},
      }).then(
        () => null,
        (error: unknown) => error
      );
      expect(failure).toBeInstanceOf(WorkingSetReadError);
      expect((failure as WorkingSetReadError).status).toBe(status);
      // No fallback list: the read rejects instead of resolving papers.
      expect(failure).not.toHaveProperty("members");
    }
  });
});

function savedMember(paperId: string, membership: "active" | "excluded", reason: string): WorkingSetMember {
  return {
    paper_id: paperId,
    membership,
    decision_origin: "manual",
    reason,
    actor: "user-1",
    changed_at: "2026-09-23T10:00:00.000Z",
  };
}

const applied = (revision: number, member: WorkingSetMember): Reply => ({
  status: 200,
  body: { topic_id: TOPIC, run_id: RUN, revision, applied: member, idempotent_repeat: false },
});

describe("working set membership write", () => {
  it("saveWorkingSetMembership issues exactly one POST with the documented body and the auth headers", async () => {
    const { calls, fetchFn } = stubFetch(applied(1, member));
    const headers = { Authorization: "Bearer test-token" };
    const result = await saveWorkingSetMembership(
      TOPIC,
      RUN,
      { fetchFn, headers }
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(calls[0].url).toBe(`${EXPECTED_PATH}/membership`);
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[0].init?.headers).toBe(headers);
    expect(calls[0].body).toEqual({
      topic_id: TOPIC,
      run_id: RUN,
      desired_membership: "excluded",
      reason: "Removed in Data → Table",
      origin: "manual",
      expected_revision: 0,
    });
  });

  it("saveWorkingSetMembership returns an idempotent repeat with the revision unchanged", async () => {
    const { fetchFn } = stubFetch({
      status: 200,
      body: { topic_id: TOPIC, run_id: RUN, revision: 3, applied: null, idempotent_repeat: true },
    });
    const result = await saveWorkingSetMembership(
      TOPIC,
      RUN,
      { fetchFn, headers: {} }
    );
  });

  it.each([
    [500, "save_failed"],
    [409, "stale_revision"],
    [400, "reason_required"],
    [404, "unknown_paper"],
  ] as const)("saveWorkingSetMembership rejects a %i as WorkingSetSaveError %s, never a saved result", async (status, code) => {
    const { fetchFn } = stubFetch({ status, body: { error: code } });
    const save = saveWorkingSetMembership(
      TOPIC,
      RUN,
      { fetchFn, headers: {} }
    );
    await expect(save).rejects.toBeInstanceOf(WorkingSetSaveError);
    await expect(save).rejects.toMatchObject({ status, code });
  });

  it("saveWorkingSetMemberships chains expected_revision from each response; an idempotent repeat keeps it", async () => {
    const reason = "Added in Data → Table";
    const { calls, fetchFn } = stubFetch(
      { status: 200, body: { topic_id: TOPIC, run_id: RUN, revision: 46, applied: null, idempotent_repeat: true } },
    );
    const seen: string[] = [];
    await saveWorkingSetMemberships(
      TOPIC,
      RUN,
        paperId,
        membership: "active" as const,
        reason,
      })),
      45,
      (result) => seen.push(result.paperId),
      { fetchFn, headers: {} }
    );
    expect(calls.map((call) => call.body?.expected_revision)).toEqual([45, 46, 46]);
    expect(calls.every((call) => call.init?.method === "POST" && call.body?.origin === "manual")).toBe(true);
  });

  it("saveWorkingSetMemberships stops at the first error, after reporting the confirmed saves before it", async () => {
    const reason = "Removed in Data → Table";
      status: 500,
      body: { error: "save_failed" },
    });
    const seen: string[] = [];
    const batch = saveWorkingSetMemberships(
      TOPIC,
      RUN,
        paperId,
        membership: "excluded" as const,
        reason,
      })),
      0,
      (result) => seen.push(result.paperId),
      { fetchFn, headers: {} }
    );
    await expect(batch).rejects.toBeInstanceOf(WorkingSetSaveError);
    await expect(batch).rejects.toMatchObject({ code: "save_failed" });
    expect(calls).toHaveLength(2);
  });

  it("saveWorkingSetMemberships rejects a network failure with nothing confirmed", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const onSaved = vi.fn();
    const batch = saveWorkingSetMemberships(
      TOPIC,
      RUN,
      0,
      onSaved,
      { fetchFn, headers: {} }
    );
    await expect(batch).rejects.toBeInstanceOf(TypeError);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("withSavedMembership applies one confirmed save to the read; an idempotent repeat changes nothing", () => {
    const state = allActiveRead();
    const next = withSavedMembership(state, { paperId: member.paper_id, revision: 1, applied: member });
    expect(next.revision).toBe(1);
    const repeat = withSavedMembership(state, { paperId: member.paper_id, revision: 0, applied: null });
    expect(repeat.members).toBe(state.members);
    expect(repeat.revision).toBe(0);
  });
});
