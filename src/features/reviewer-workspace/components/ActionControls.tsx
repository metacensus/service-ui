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
  fieldType?: string | null;
  originalValue: unknown;
  onApprove: () => Promise<unknown>;
  onCorrect: (corrected: CorrectedPayload) => Promise<unknown>;
  onFlag: (reason: string) => Promise<unknown>;
};

type OpenForm = "correct" | "flag" | null;

const ActionControls = ({
  state,
  reviewerName,
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

  const hasReviewer = Boolean(reviewerName?.trim());
  const disabled = !hasReviewer || busy || selectedCount === 0;

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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="xs"
          variant="primary"
          disabled={disabled}
          onClick={() => void run(onApprove)}
        >
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setOpenForm(openForm === "correct" ? null : "correct")}
        >
          Correct…
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpenForm(openForm === "flag" ? null : "flag")}
        >
        </Button>
        {state !== "open" && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${stateChipClass(state)}`}
          >
          </span>
        )}
        {!hasReviewer && (
            Set your reviewer name to enable decisions.
          </span>
        )}
            Correct… needs exactly one checked question.
          </span>
        )}
      </div>

        <form
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
              Save correction
            </Button>
            <Button size="xs" variant="ghost" type="button" onClick={() => setOpenForm(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!flagReason.trim()) return;
            void run(() => onFlag(flagReason.trim()));
          }}
        >
          </label>
          <Textarea
            className="bg-white text-sm"
            rows={2}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="What a later reviewer should look at"
            autoFocus
          />
          <div className="flex gap-2">
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
