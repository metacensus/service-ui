export type ReviewSessionFlag = "useWorkingSet" | "includeNonAmbiguous";

export const REVIEW_SESSION_KEYS: Record<ReviewSessionFlag, string> = {
  useWorkingSet: "metacensus:review-use-working-set",
  includeNonAmbiguous: "metacensus:review-include-non-ambiguous",
};

  useWorkingSet: true,
  includeNonAmbiguous: false,
};

export function readReviewSessionFlag(
  storage: Pick<Storage, "getItem"> | null | undefined,
  flag: ReviewSessionFlag
): boolean {
  try {
    const stored = storage?.getItem(REVIEW_SESSION_KEYS[flag]);
    return stored === "true" ? true : stored === "false" ? false : REVIEW_SESSION_DEFAULTS[flag];
  } catch {
    return REVIEW_SESSION_DEFAULTS[flag];
  }
}

export function writeReviewSessionFlag(
  storage: Pick<Storage, "setItem"> | null | undefined,
  flag: ReviewSessionFlag,
  value: boolean
): void {
  try {
    storage?.setItem(REVIEW_SESSION_KEYS[flag], String(value));
  } catch {
    // Private mode or quota: the toggle still applies until the page closes.
  }
}

// Which kind sections and "Confident extractions" groups are open, so that
// coming back from a task shows the landing as it was left.

export const REVIEW_EXPANSION_KEY = "metacensus:review-landing-expansion";

export type ReviewExpansion = {
  sections: Record<string, boolean>;
  confident: Record<string, boolean>;
};

const booleans = (value: unknown): Record<string, boolean> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(([, v]) => typeof v === "boolean")
      )
    : {};

export function readReviewExpansion(
  storage: Pick<Storage, "getItem"> | null | undefined
): ReviewExpansion {
  try {
    const parsed = JSON.parse(storage?.getItem(REVIEW_EXPANSION_KEY) ?? "null");
    return { sections: booleans(parsed?.sections), confident: booleans(parsed?.confident) };
  } catch {
    return { sections: {}, confident: {} };
  }
}

export function writeReviewExpansion(
  storage: Pick<Storage, "setItem"> | null | undefined,
  expansion: ReviewExpansion
): void {
  try {
    storage?.setItem(REVIEW_EXPANSION_KEY, JSON.stringify(expansion));
  } catch {
    // Private mode or quota: the sections still open until the page closes.
  }
}
