"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { MembershipEditor, type MembershipEditorOutcome } from "../MembershipEditor";
import { MembershipContext } from "./membershipContext";
import {
  FAILED_SAVE_MESSAGE,
  bubbleAriaLabel,
  doneMessage,
  editorAction,
  editorCurrentLine,
  membershipDot,
  membershipShortLabel,
  saveErrorMessage,
  workingSetCounts,
  type MembershipDot,
} from "../../model/membership";

// Shape carries the origin; colour only reinforces it.
const DOT_CLASS: Record<MembershipDot, string> = {
  "included-default": "rounded-full border border-solid border-mc-fill-solid bg-mc-fill-solid",
  "included-recorded": "rounded-[2px] border border-dashed border-mc-line-accent bg-mc-line-accent",
  "excluded-recorded": "rounded-full border-2 border-solid border-mc-alert-border bg-white",
  "excluded-default": "rounded-full border-2 border-dashed border-mc-line-input bg-white",
};

const BUBBLE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 align-middle text-[11px] font-bold leading-4 text-foreground";

/** After a save moves a bubble (e.g. between summary lists), focus the one now shown. */
function focusVisibleBubble(paperId: string, scope: ParentNode) {
  const candidates = Array.from(
    scope.querySelectorAll<HTMLButtonElement>(`button[data-membership-paper="${CSS.escape(paperId)}"]`)
  );
  candidates.find((node) => !node.disabled && node.getClientRects().length > 0)?.focus({ preventScroll: true });
}

export function MembershipBubble({
  paperId,
  title,
  onEditorOpenChange,
}: {
  paperId: string;
  title: string;
  onEditorOpenChange?: (open: boolean) => void;
}) {
  const context = useContext(MembershipContext);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const workingSet = context?.workingSet;
  const member = workingSet?.members.get(paperId);
  const unavailable = !workingSet || workingSet.status !== "ready" || !member;

  // A read that fails while the editor is open closes it: there is no state to edit.
  useEffect(() => {
    if (unavailable && open) {
      setOpen(false);
      onEditorOpenChange?.(false);
    }
  }, [unavailable, open, onEditorOpenChange]);

  if (unavailable) {
    return (
      <button type="button" disabled className={`${BUBBLE_CLASS} cursor-default text-muted-foreground`}>
        {!workingSet || workingSet.status === "loading" ? "Checking…" : "Selection unavailable"}
      </button>
    );
  }

  const action = editorAction(member);

  function setEditorOpen(next: boolean) {
    setOpen(next);
    // An earlier "Done" must not sit beside this edit's outcome.
    if (next) context?.onSaved(null);
    onEditorOpenChange?.(next);
  }

  async function save(reason: string): Promise<MembershipEditorOutcome> {
    if (!workingSet) return { ok: false, message: FAILED_SAVE_MESSAGE };
    const scope = triggerRef.current?.closest("[data-membership-scope]") ?? document;
    const result = await workingSet.saveMembership(paperId, action.membership, reason.trim());
    if (!result.ok) return { ok: false, message: saveErrorMessage(result.error) };
    const counts = workingSetCounts(result.workingSet ?? workingSet.workingSet!);
    const trigger = triggerRef.current;
    setEditorOpen(false);
    context?.onSaved(doneMessage(title, action.membership, counts));
    if (!trigger?.isConnected) focusVisibleBubble(paperId, scope);
    return { ok: true };
  }

  return (
    <MembershipEditor
      open={open}
      onOpenChange={setEditorOpen}
      onConfirm={save}
      idBase={paperId}
      subject={title}
      currentLine={editorCurrentLine(member)}
      reasonRequired
      confirmLabel={action.label}
    >
      <button
        ref={triggerRef}
        type="button"
        data-membership-paper={paperId}
        aria-label={bubbleAriaLabel(title, member)}
        className={`${BUBBLE_CLASS} cursor-pointer hover:border-mc-line-accent hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`}
      >
        <span aria-hidden="true" data-membership-dot className={`box-border h-2.5 w-2.5 shrink-0 ${DOT_CLASS[membershipDot(member)]}`} />
        <span>{membershipShortLabel(member)}</span>
      </button>
    </MembershipEditor>
  );
}
