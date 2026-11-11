// An empty active set is empty — no code path turns an empty or failed read
// into "all papers".

import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { routes } from "@/lib/routes";

export type WorkingSetMembership = "active" | "excluded";
export type WorkingSetDecisionOrigin = "default" | "manual" | "agent_confirmed";

export type WorkingSetMember = {
  paper_id: string;
  membership: WorkingSetMembership;
  decision_origin: WorkingSetDecisionOrigin;
  reason: string | null;
  actor: string | null;
  changed_at: string | null;
};

export type WorkingSetHistoryEntry = {
  revision: number;
  paper_id: string;
  previous_membership: WorkingSetMembership;
  new_membership: WorkingSetMembership;
  reason: string;
  origin: string;
  actor: string;
  changed_at: string;
};

export type WorkingSet = {
  topic_id: string;
  run_id: string;
  revision: number;
  members: WorkingSetMember[];
  history: WorkingSetHistoryEntry[];
};

export class WorkingSetReadError extends Error {
  status: number;
  url: string;

  constructor(url: string, status: number, statusText: string) {
    super(`Working-set read failed: ${status} ${statusText} (${url})`);
    this.name = "WorkingSetReadError";
    this.status = status;
    this.url = url;
  }
}

const MEMBERSHIPS: ReadonlySet<string> = new Set(["active", "excluded"]);
const ORIGINS: ReadonlySet<string> = new Set(["default", "manual", "agent_confirmed"]);

/** Hand-written guard in the style of `validatePaperRows` in data/snapshot.ts. */
export function validateWorkingSet(value: unknown): WorkingSet {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid working set: response must be an object");
  }
  const body = value as Record<string, unknown>;
  if (typeof body.topic_id !== "string") {
    throw new Error("Invalid working set: topic_id must be a string");
  }
  if (typeof body.run_id !== "string") {
    throw new Error("Invalid working set: run_id must be a string");
  }
  if (typeof body.revision !== "number") {
    throw new Error("Invalid working set: revision must be a number");
  }
  if (!Array.isArray(body.members)) {
    throw new Error("Invalid working set: members must be an array");
  }
  for (const member of body.members as WorkingSetMember[]) {
    if (!member || typeof member !== "object" || typeof member.paper_id !== "string") {
      throw new Error("Invalid working set: malformed member");
    }
    if (!MEMBERSHIPS.has(member.membership)) {
      throw new Error(
        `Invalid working set for ${member.paper_id}: unsupported membership ${JSON.stringify(member.membership)}`
      );
    }
    if (!ORIGINS.has(member.decision_origin)) {
      throw new Error(
        `Invalid working set for ${member.paper_id}: unsupported decision_origin ${JSON.stringify(member.decision_origin)}`
      );
    }
  }
  if (!Array.isArray(body.history)) {
    throw new Error("Invalid working set: history must be an array");
  }
  return value as WorkingSet;
}

export type WorkingSetDeps = {
  fetchFn?: typeof fetch;
  headers?: HeadersInit;
};

/**
 * Read the working set: exactly one GET to `routes.api.workingSet`. A
 * non-2xx response throws a `WorkingSetReadError` carrying the HTTP status —
 * never a fallback member list.
 */
export async function fetchWorkingSet(
  topicId: string,
  runId: string,
  deps: WorkingSetDeps = {}
): Promise<WorkingSet> {
  const url = routes.api.workingSet(topicId, runId);
  const headers = deps.headers ?? getAuthHeaders();
  const fetchFn = deps.fetchFn ?? fetch;
  const response = await fetchFn(url, { method: "GET", headers });
  if (!response.ok) {
    throw new WorkingSetReadError(url, response.status, response.statusText);
  }
  return validateWorkingSet(await response.json());
}

/** `paper_id`s with `membership === "active"`, in response order. */
export function activePaperIds(workingSet: WorkingSet): string[] {
  return workingSet.members
    .filter((member) => member.membership === "active")
    .map((member) => member.paper_id);
}

export type WorkingSetChange = {
  paperId: string;
  membership: WorkingSetMembership;
  reason: string;
};

export type WorkingSetSaveResult = {
  paperId: string;
  revision: number;
  /** Null for an idempotent repeat. */
  applied: WorkingSetMember | null;
};

export class WorkingSetSaveError extends Error {
  status: number;
  code: string | null;
  url: string;

  constructor(url: string, status: number, code: string | null) {
    super(`Working-set save failed: ${status} ${code ?? "unknown"} (${url})`);
    this.name = "WorkingSetSaveError";
    this.status = status;
    this.code = code;
    this.url = url;
  }
}

export async function saveWorkingSetMembership(
  topicId: string,
  runId: string,
  change: WorkingSetChange & { expectedRevision: number },
  deps: WorkingSetDeps = {}
): Promise<WorkingSetSaveResult> {
  const url = routes.api.workingSetMembership(topicId, runId);
  const body = {
    topic_id: topicId,
    run_id: runId,
    paper_id: change.paperId,
    desired_membership: change.membership,
    reason: change.reason,
    origin: "manual",
    expected_revision: change.expectedRevision,
  };
  const headers = deps.headers ?? getAuthHeaders();
  const fetchFn = deps.fetchFn ?? fetch;
  const response = await fetchFn(url, { method: "POST", headers, body: JSON.stringify(body) });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new WorkingSetSaveError(url, response.status, typeof payload?.error === "string" ? payload.error : null);
  }
  if (!payload || typeof payload.revision !== "number") {
    throw new Error("Invalid working-set save response: revision is required");
  }
  const applied = (payload.applied ?? null) as WorkingSetMember | null;
  if (applied !== null && (typeof applied !== "object" || applied.paper_id !== change.paperId)) {
    throw new Error(`Invalid working-set save response: applied member is not ${change.paperId}`);
  }
  return { paperId: change.paperId, revision: payload.revision, applied };
}

export async function saveWorkingSetMemberships(
  topicId: string,
  runId: string,
  changes: WorkingSetChange[],
  startRevision: number,
  onSaved: (result: WorkingSetSaveResult) => void,
  deps: WorkingSetDeps = {}
): Promise<void> {
  let revision = startRevision;
  for (const change of changes) {
    const result = await saveWorkingSetMembership(topicId, runId, { ...change, expectedRevision: revision }, deps);
    revision = result.revision;
    onSaved(result);
  }
}

export function withSavedMembership(workingSet: WorkingSet, result: WorkingSetSaveResult): WorkingSet {
  const applied = result.applied;
  return {
    ...workingSet,
    revision: result.revision,
    members: applied
      ? workingSet.members.map((member) => (member.paper_id === applied.paper_id ? applied : member))
      : workingSet.members,
  };
}
