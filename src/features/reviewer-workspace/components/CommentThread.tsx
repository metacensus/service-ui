"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import formatIsoDate from "@/functions/formatIsoDate";
import type { ReviewComment } from "../types";

type CommentThreadProps = {
  comments: ReviewComment[];
  reviewerName: string | null;
  onAdd: (text: string) => Promise<unknown>;
};

// Lightweight audit-trail thread. Comments carry author + timestamp so a
// discussion about a value stays attached to that value.
const CommentThread = ({ comments, reviewerName, onAdd }: CommentThreadProps) => {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const hasReviewer = Boolean(reviewerName?.trim());

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      await onAdd(text);
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
                · {formatIsoDate(comment.created_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Textarea
          aria-label="Review comment"
          className="text-sm"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            hasReviewer ? "Add a comment…" : "Set your reviewer name to comment"
          }
          disabled={!hasReviewer || busy}
        />
        <Button size="xs" variant="secondary" type="submit" disabled={!hasReviewer || busy || !draft.trim()}>
          Comment
        </Button>
      </form>
    </div>
  );
};

export default CommentThread;
