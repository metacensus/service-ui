import { describe, expect, it } from "vitest";
import type { ExploreEvidence } from "../types";
import {
  chatSessionKey,
  parseChatSession,
  readChatSession,
  serializeChatSession,
  writeChatSession,
  type ChatSession,
} from "./chatSession";

const evidence = {
  evidence_id: "ev_qyp0nd",
  row_index: 16,
  field: "n_total",
  source_index: 1,
  pdf_page: 4,
} as ExploreEvidence;

const session: ChatSession = {
  sessionId: "4f1c6a3e-0000-4000-8000-000000000001",
  turns: [
    {
      question: "What did the answer papers report?",
      response: { answer: "Fixture answer", model: "simulated-fixture", steps: [], evidence: [evidence], set_revision: 3 },
    },
  ],
  active: evidence,
};

describe("chatSessionKey", () => {
  it("scopes the conversation to the topic and run", () => {
    expect(chatSessionKey("topc:1", "run_a")).toBe("metacensus:explore-chat:v1:topc:1:run_a");
    expect(chatSessionKey("topc:1", "run_b")).not.toBe(chatSessionKey("topc:1", "run_a"));
  });
});

describe("chat session storage", () => {
  it("round-trips the turns, session id and open source", () => {
    expect(parseChatSession(serializeChatSession(session))).toEqual(session);
  });

  it("restores a conversation with no open source", () => {
    expect(parseChatSession(serializeChatSession({ ...session, active: null }))?.active).toBeNull();
  });

  it("drops nothing stored, bad JSON and other versions", () => {
    expect(parseChatSession(null)).toBeNull();
    expect(parseChatSession("{not json")).toBeNull();
    expect(parseChatSession(JSON.stringify({ ...session, version: 2 }))).toBeNull();
  });

  it("drops a malformed session rather than half-restoring it", () => {
    const stored = JSON.parse(serializeChatSession(session));
    expect(parseChatSession(JSON.stringify({ ...stored, sessionId: "" }))).toBeNull();
    expect(parseChatSession(JSON.stringify({ ...stored, turns: [{ question: "q" }] }))).toBeNull();
    expect(parseChatSession(JSON.stringify({ ...stored, turns: "nope" }))).toBeNull();
  });

  it("ignores an unreadable open source but keeps the conversation", () => {
    const stored = JSON.parse(serializeChatSession(session));
    const parsed = parseChatSession(JSON.stringify({ ...stored, active: { quote: "no ids" } }));
    expect(parsed?.turns).toHaveLength(1);
    expect(parsed?.active).toBeNull();
  });
});

describe("readChatSession / writeChatSession", () => {
  it("reads back what it wrote", () => {
    const store = new Map<string, string>();
    const storage = () => ({
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
    writeChatSession(storage, "k", session);
    expect(readChatSession(storage, "k")).toEqual(session);
  });

  it("treats blocked or full storage as no session and never throws", () => {
    const blocked = (): Storage => {
      throw new Error("SecurityError");
    };
    const full = () => ({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(readChatSession(blocked, "k")).toBeNull();
    expect(() => writeChatSession(blocked, "k", session)).not.toThrow();
    expect(() => writeChatSession(full, "k", session)).not.toThrow();
  });
});
    const store = new Map<string, string>();
    const storage = () => ({
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
    writeChatSession(storage, "k", session);
