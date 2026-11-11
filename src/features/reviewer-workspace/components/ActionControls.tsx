"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseCorrectionValue } from "../model/correctionValue";
import { stateChipClass, type RowReviewState } from "../model/rowStatus";
import type { CorrectedPayload } from "../types";

type ActionControlsProps = {
  state: RowReviewState;
  reviewerName: string | null;
  /** Checked questions of a task with several; each action applies to them. */
  selectedCount?: number;
  fieldType?: string | null;
  originalValue: unknown;
  onApprove: () => Promise<unknown>;
  onCorrect: (corrected: CorrectedPayload) => Promise<unknown>;
  onFlag: (reason: string) => Promise<unknown>;
};

type OpenForm = "correct" | "flag" | null;

// Approve / correct / flag for one value, or for the checked questions when
// `selectedCount` is given (Correct… then needs exactly one). Buttons stay
// disabled with a visible reason until reviewer identity exists; the latest
// decision is always shown so re-deciding is explicit, never silent.
const ActionControls = ({
  state,
  reviewerName,
  selectedCount,
  fieldType,
  originalValue,
  onApprove,
  onCorrect,
  onFlag,
}: ActionControlsProps) => {
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctedValue, setCorrectedValue] = useState("");
  const [correctedNote, setCorrectedNote] = useState("");
  const [flagReason, setFlagReason] = useState("");

  const multi = selectedCount !== undefined;
  const k = selectedCount?.toLocaleString("en-US");
  const canCorrect = !multi || selectedCount === 1;
  const hasReviewer = Boolean(reviewerName?.trim());
  const disabled = !hasReviewer || busy || selectedCount === 0;
  const form: OpenForm =
    (openForm === "correct" && !canCorrect) || selectedCount === 0 ? null : openForm;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setOpenForm(null);
      setCorrectedValue("");
      setCorrectedNote("");
      setFlagReason("");
    } catch {
      setError("Could not record the decision. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid={multi ? "task-decision-controls" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="xs"
          variant="primary"
          disabled={disabled}
          data-testid={multi ? "approve-selected" : undefined}
          onClick={() => void run(onApprove)}
        >
          {multi ? `Approve ${k} selected` : "Approve"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={disabled || !canCorrect}
          data-testid={multi ? "correct-selected" : undefined}
          onClick={() => setOpenForm(openForm === "correct" ? null : "correct")}
        >
          Correct…
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={disabled}
          data-testid={multi ? "flag-selected" : undefined}
          onClick={() => setOpenForm(openForm === "flag" ? null : "flag")}
        >
          {multi ? `Flag ${k} selected…` : "Flag…"}
        </Button>
        {state !== "open" && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${stateChipClass(state)}`}
          >
            {state}
          </span>
        )}
        {!hasReviewer && (
          <span className="text-xs text-muted-foreground">
            Set your reviewer name to enable decisions.
          </span>
        )}
        {hasReviewer && selectedCount === 0 && (
          <span className="text-xs text-muted-foreground">
            Check at least one question to decide.
          </span>
        )}
        {hasReviewer && multi && selectedCount > 1 && (
          <span className="text-xs text-muted-foreground">
            Correct… needs exactly one checked question.
          </span>
        )}
        {error && <span className="text-xs text-mc-alert-ink">{error}</span>}
      </div>

      {form === "correct" && (
        <form
          className="mt-3 flex flex-col gap-2 rounded-md border bg-secondary p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseCorrectionValue(
              correctedValue,
              fieldType,
              originalValue
            );
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            void run(() =>
              onCorrect({
                value: parsed.value,
                ...(correctedNote.trim() ? { note: correctedNote.trim() } : {}),
              })
            );
          }}
        >
          <label className="text-xs font-bold text-foreground" htmlFor="corrected-value">
            Corrected value
          </label>
          <Input
            id="corrected-value"
            className="h-8 bg-white text-sm"
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            placeholder="The value the source supports"
            autoFocus
          />
          <label className="text-xs font-bold text-foreground" htmlFor="corrected-note">
            Note (optional)
          </label>
          <Textarea
            id="corrected-note"
            className="bg-white text-sm"
            rows={2}
            value={correctedNote}
            onChange={(e) => setCorrectedNote(e.target.value)}
            placeholder="Why the extracted value was wrong"
          />
          <div className="flex gap-2">
            <Button size="xs" variant="secondary" type="submit" disabled={busy || !correctedValue.trim()}>
              Save correction
            </Button>
            <Button size="xs" variant="ghost" type="button" onClick={() => setOpenForm(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {form === "flag" && (
        <form
          className="mt-3 flex flex-col gap-2 rounded-md border bg-secondary p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!flagReason.trim()) return;
            void run(() => onFlag(flagReason.trim()));
          }}
        >
          <label
            className="text-xs font-bold text-foreground"
            htmlFor={multi ? "task-flag-reason" : "flag-reason"}
          >
            {multi ? "Why do the checked questions need attention?" : "Why does this need attention?"}
          </label>
          <Textarea
            id={multi ? "task-flag-reason" : "flag-reason"}
            className="bg-white text-sm"
            rows={2}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="What a later reviewer should look at"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="xs" variant="secondary" type="submit" disabled={busy || !flagReason.trim()}>
              {multi ? `Flag ${k} selected` : "Flag for follow-up"}
            </Button>
            <Button size="xs" variant="ghost" type="button" onClick={() => setOpenForm(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ActionControls;
