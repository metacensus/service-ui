import {
  del as deleteIndexedDbValue,
  get as getIndexedDbValue,
  set as setIndexedDbValue,
} from "@/lib/indexdb";
import type {
  DemoReviewState,
  NewReviewComment,
  ReviewAction,
  ReviewComment,
  ReviewerPersistenceAdapter,
  StoredReviewAction,
} from "../types";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "metacensus:reviewer-workspace:v1";

const memoryState = new Map<string, DemoReviewState>();

function emptyState(): DemoReviewState {
  return {
    version: STORAGE_VERSION,
    actions: [],
    actionHistory: [],
    comments: [],
  };
}

function cloneState(state: DemoReviewState): DemoReviewState {
  return JSON.parse(JSON.stringify(state)) as DemoReviewState;
}

function parseState(raw: unknown): DemoReviewState {
  if (!raw) return emptyState();
  try {
    const parsed =
      typeof raw === "string"
        ? (JSON.parse(raw) as Partial<DemoReviewState>)
        : (raw as Partial<DemoReviewState>);

    return {
      version: STORAGE_VERSION,
      reviewerName:
        typeof parsed.reviewerName === "string"
          ? parsed.reviewerName
          : undefined,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      actionHistory: Array.isArray(parsed.actionHistory)
        ? parsed.actionHistory
        : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return emptyState();
  }
}

function storageKey(topicId: string, runId: string): string {
  return `${STORAGE_PREFIX}:${topicId}:${runId}`;
}

function actionKey(action: ReviewAction): string {
  if (action.action === "adjudicate_gold") {
    return JSON.stringify([
      "adjudicate_gold",
      action.run_id,
      action.paper_id,
      action.gold_index ?? null,
      action.field ?? null,
    ]);
  }

  return JSON.stringify([
    "row",
    action.run_id,
    action.paper_id,
    action.row_index ?? null,
    action.field ?? null,
  ]);
}

function nextId(state: DemoReviewState): number {
  const actionIds = state.actions.map((action) => action.id);
  const historyIds = (state.actionHistory ?? []).map((action) => action.id);
  const commentIds = state.comments.map((comment) => comment.id);
  return Math.max(0, ...actionIds, ...historyIds, ...commentIds) + 1;
}

export function createLocalReviewerPersistence(
  topicId: string,
  runId: string
): ReviewerPersistenceAdapter {
  const key = storageKey(topicId, runId);
  let useMemoryFallback = false;

  const readMemoryState = (): DemoReviewState => {
    return cloneState(memoryState.get(key) ?? emptyState());
  };

  const readState = async (): Promise<DemoReviewState> => {
    if (useMemoryFallback) return readMemoryState();

    try {
      return parseState(await getIndexedDbValue<unknown>(key));
    } catch {
      useMemoryFallback = true;
      return readMemoryState();
    }
  };

  const writeState = async (state: DemoReviewState): Promise<void> => {
    const nextState = cloneState(state);

    if (useMemoryFallback) {
      memoryState.set(key, nextState);
      return;
    }

    try {
      await setIndexedDbValue(key, nextState);
    } catch {
      useMemoryFallback = true;
      memoryState.set(key, nextState);
    }
  };

  const removeState = async (): Promise<void> => {
    if (useMemoryFallback) {
      memoryState.delete(key);
      return;
    }

    try {
      await deleteIndexedDbValue(key);
    } catch {
      useMemoryFallback = true;
      memoryState.delete(key);
    }
  };

  const storeAction = (
    state: DemoReviewState,
    action: ReviewAction
  ): StoredReviewAction => {
    const stored: StoredReviewAction = {
      ...action,
      id: nextId(state),
      created_at: new Date().toISOString(),
    };

    const replaced = state.actions.filter(
      (existing) => actionKey(existing) === actionKey(action)
    );
    state.actionHistory = [...(state.actionHistory ?? []), ...replaced];
    state.actions = [
      ...state.actions.filter(
        (existing) => actionKey(existing) !== actionKey(action)
      ),
      stored,
    ];
    return stored;
  };

  return {
    async getReviewerName() {
      return (await readState()).reviewerName ?? null;
    },

    async setReviewerName(name) {
      const state = await readState();
      state.reviewerName = name;
      await writeState(state);
    },

    async listActions(requestedRunId) {
      return (await readState()).actions.filter(
        (action) => action.run_id === requestedRunId
      );
    },

    async listActionHistory(requestedRunId) {
      const state = await readState();
      return (state.actionHistory ?? [])
        .filter((action) => action.run_id === requestedRunId)
        .sort((a, b) => a.id - b.id);
    },

    async upsertAction(action) {
      const state = await readState();
      const stored = storeAction(state, action);
      await writeState(state);
      return stored;
    },

    async bulkUpsertActions(_requestedRunId, actions) {
      const state = await readState();
      let id = nextId(state);
      const latestActionsByKey = new Map<string, StoredReviewAction>();
      const incomingKeys = new Set<string>();

      for (const action of actions) {
        const key = actionKey(action);
        incomingKeys.add(key);
        const supersededIncoming = latestActionsByKey.get(key);
        if (supersededIncoming) {
          state.actionHistory = [
            ...(state.actionHistory ?? []),
            supersededIncoming,
          ];
        }
        latestActionsByKey.delete(key);
        latestActionsByKey.set(key, {
          ...action,
          id,
          created_at: new Date().toISOString(),
        });
        id += 1;
      }

      const replaced = state.actions.filter((existing) =>
        incomingKeys.has(actionKey(existing))
      );
      state.actionHistory = [...(state.actionHistory ?? []), ...replaced];
      state.actions = [
        ...state.actions.filter(
          (existing) => !incomingKeys.has(actionKey(existing))
        ),
        ...latestActionsByKey.values(),
      ];
      await writeState(state);
      return { inserted: actions.length };
    },

    async deleteAction(id) {
      const state = await readState();
      const current = state.actions.find((action) => action.id === id);
      state.actions = state.actions.filter((action) => action.id !== id);
      if (current) {
        const history = state.actionHistory ?? [];
        const prior = history
          .filter((action) => actionKey(action) === actionKey(current))
          .sort((a, b) => b.id - a.id)[0];
        if (prior) {
          state.actionHistory = history.filter((action) => action.id !== prior.id);
          state.actions = [...state.actions, prior];
        }
      }
      await writeState(state);
    },

    async listComments(requestedRunId, paperId) {
      return (await readState()).comments.filter((comment) => {
        if (comment.run_id !== requestedRunId) return false;
        if (paperId && comment.paper_id !== paperId) return false;
        return true;
      });
    },

    async addComment(comment: NewReviewComment) {
      const state = await readState();
      const stored: ReviewComment = {
        ...comment,
        id: nextId(state),
        created_at: new Date().toISOString(),
      };
      state.comments = [...state.comments, stored];
      await writeState(state);
      return stored;
    },

    async deleteComment(id) {
      const state = await readState();
      state.comments = state.comments.filter((comment) => comment.id !== id);
      await writeState(state);
    },

    async resetReviewState(requestedRunId) {
      if (requestedRunId && requestedRunId !== runId) return;
      await removeState();
    },
  };
}
