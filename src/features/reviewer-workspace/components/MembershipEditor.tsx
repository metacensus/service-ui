"use client";

// The working-set reason editor shared by Data → Chat (one paper, reason
// required) and Data → Table (the ticked papers, reason optional).

import { useRef, useState, type ReactElement, type RefObject } from "react";
import * as Popover from "@radix-ui/react-popover";
import { BLANK_REASON_MESSAGE } from "../model/membership";

/** What a confirm resolved to; a failure keeps the editor open with its message. */
export type MembershipEditorOutcome = { ok: true } | { ok: false; message: string };

type PanelText = {
  /** Unique on the page: the heading is `membership-editor-{idBase}`, the field `membership-reason-{idBase}`. */
  idBase: string;
  /** Follows "Paper selection — ". */
  subject: string;
  currentLine: string;
  reasonRequired: boolean;
  confirmLabel: string;
};

export type MembershipEditorPanelProps = PanelText & {
  reason: string;
  onReasonChange: (reason: string) => void;
  error: string | null;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
};

/** The editor's contents, without the popover around them. */
export function MembershipEditorPanel({
  idBase,
  subject,
  currentLine,
  reasonRequired,
  confirmLabel,
  reason,
  onReasonChange,
  error,
  pending,
  onConfirm,
  onCancel,
  textareaRef,
}: MembershipEditorPanelProps) {
  return (
    <>
        Paper selection — {subject}
      </h3>
      <label
        htmlFor={`membership-reason-${idBase}`}
      >
        {reasonRequired ? "Reason (required)" : "Reason (optional)"}
      </label>
      <textarea
        ref={textareaRef}
        id={`membership-reason-${idBase}`}
        aria-label={
          reasonRequired ? "Reason for changing paper selection" : "Reason for changing paper selection (optional)"
        }
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        rows={3}
      />
        {error}
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

/**
 * A popover editor anchored to `children` (its trigger). The caller owns `open`;
 * the editor owns the reason, the error and the pending save. Opening clears the
 * reason and the error. `onConfirm` gets the reason as typed and closes the
 * editor itself on success.
 */
export function MembershipEditor({
  open,
  onOpenChange,
  onConfirm,
  children,
  ...text
}: PanelText & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<MembershipEditorOutcome>;
  children: ReactElement;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function setEditorOpen(next: boolean) {
    if (next) {
      setReason("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function confirm() {
    if (pending) return;
    if (text.reasonRequired && !reason.trim()) {
      setError(BLANK_REASON_MESSAGE);
      textareaRef.current?.focus();
      return;
    }
    setPending(true);
    setError(null);
    const outcome = await onConfirm(reason);
    setPending(false);
    if (!outcome.ok) {
      setError(outcome.message);
      // The disabled confirm button dropped focus while the request was pending.
      textareaRef.current?.focus();
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setEditorOpen}>
      <Popover.Trigger asChild ref={triggerRef}>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          aria-labelledby={`membership-editor-${text.idBase}`}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            textareaRef.current?.focus({ preventScroll: true });
          }}
          // Back to the trigger unless the reviewer already moved focus elsewhere.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const current = document.activeElement;
            if (!current || current === document.body || current.closest("[data-membership-editor]"))
              triggerRef.current?.focus({ preventScroll: true });
          }}
          data-membership-editor
        >
          <MembershipEditorPanel
            {...text}
            reason={reason}
            onReasonChange={setReason}
            error={error}
            pending={pending}
            onConfirm={() => void confirm()}
            onCancel={() => setEditorOpen(false)}
            textareaRef={textareaRef}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
