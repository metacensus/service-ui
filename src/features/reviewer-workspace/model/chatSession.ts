// Data → Chat's conversation, kept in sessionStorage so a trip to Review and
// back returns to the same turns, Explore session and open source. Anything
// unreadable is dropped, never half-restored.

import type { ExploreEvidence, ExploreResponse } from "../types";

export type ChatTurn = { question: string; response: ExploreResponse };

export type ChatSession = {
  sessionId: string;
  turns: ChatTurn[];
  /** The source open in the lens. */
  active: ExploreEvidence | null;
};

const VERSION = 1;

export function chatSessionKey(topicId: string, runId: string): string {
  return `metacensus:explore-chat:v${VERSION}:${topicId}:${runId}`;
}

function isResponse(value: unknown): value is ExploreResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return typeof response.answer === "string" && Array.isArray(response.evidence) && Array.isArray(response.steps);
}

function isTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Record<string, unknown>;
  return typeof turn.question === "string" && isResponse(turn.response);
}

function isEvidence(value: unknown): value is ExploreEvidence {
  if (!value || typeof value !== "object") return false;
  const evidence = value as Record<string, unknown>;
  return typeof evidence.evidence_id === "string" && typeof evidence.paper_id === "string";
}

export function parseChatSession(raw: string | null): ChatSession | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const stored = value as Record<string, unknown>;
  if (stored.version !== VERSION || typeof stored.sessionId !== "string" || !stored.sessionId) return null;
  if (!Array.isArray(stored.turns) || !stored.turns.every(isTurn)) return null;
  const active = stored.active == null ? null : isEvidence(stored.active) ? stored.active : null;
  return { sessionId: stored.sessionId, turns: stored.turns, active };
}

export function serializeChatSession(session: ChatSession): string {
  return JSON.stringify({ version: VERSION, ...session });
}

// Storage can be unavailable or full; the conversation then lives only in
// memory. `storage` is a getter because reading `window.sessionStorage` can
// itself throw, and that must stay inside the try.
export function readChatSession(storage: () => Pick<Storage, "getItem">, key: string): ChatSession | null {
  try {
    return parseChatSession(storage().getItem(key));
  } catch {
    return null;
  }
}

export function writeChatSession(storage: () => Pick<Storage, "setItem">, key: string, session: ChatSession): void {
  try {
    storage().setItem(key, serializeChatSession(session));
  } catch {
    // Keep going without persistence.
  }
}
