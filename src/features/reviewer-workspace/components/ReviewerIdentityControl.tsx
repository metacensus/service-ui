"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionNameSuggestion } from "../hooks/useReviewerIdentity";

type ReviewerIdentityControlProps = {
  reviewerName: string | null;
  onSave: (name: string) => Promise<unknown>;
};

// "Reviewing as ..." — reviewer identity is a prerequisite for decisions, so
// it lives at the top of the workspace, editable in place. Decisions recorded
// while reviewing carry this name in their audit trail.
const ReviewerIdentityControl = ({
  reviewerName,
  onSave,
}: ReviewerIdentityControlProps) => {
  const suggestion = useSessionNameSuggestion();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const hasName = Boolean(reviewerName?.trim());

  // First visit with a usable session identity: adopt it silently so the
  // logged-in demo user is the reviewer without an extra step. Skipped once
  // the reviewer has started typing a name of their own.
  useEffect(() => {
    if (!hasName && suggestion && !editing && !draft.trim()) {
      void onSave(suggestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasName, suggestion, editing, draft]);

  const startEditing = () => {
    setDraft(reviewerName ?? suggestion ?? "");
    setEditing(true);
  };

  const save = async () => {
    const name = draft.trim();
    if (!name) return;
    await onSave(name);
    setEditing(false);
  };

  if (editing || !hasName) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label
          htmlFor="reviewer-name"
          className="text-xs font-bold text-muted-foreground whitespace-nowrap"
        >
          Reviewing as
        </label>
        <Input
          id="reviewer-name"
          className="h-8 w-48 text-sm"
          value={draft}
          placeholder="Your name"
          autoFocus={editing}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="xs" variant="secondary" disabled={!draft.trim()}>
          Save
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs font-bold text-muted-foreground">Reviewing as</span>
      <span className="font-medium text-foreground">{reviewerName}</span>
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-mc-ink-accent"
        onClick={startEditing}
      >
        change
      </button>
    </div>
  );
};

export default ReviewerIdentityControl;
