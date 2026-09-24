"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { MembershipContext } from "./membershipContext";
import {
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
};

const BUBBLE_CLASS =

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
        {!workingSet || workingSet.status === "loading" ? "Checking…" : "Selection unavailable"}
      </button>
    );
  }

  const action = editorAction(member);

  function setEditorOpen(next: boolean) {
    setOpen(next);
    // An earlier "Done" must not sit beside this edit's outcome.
    onEditorOpenChange?.(next);
  }

    const scope = triggerRef.current?.closest("[data-membership-scope]") ?? document;
    const counts = workingSetCounts(result.workingSet ?? workingSet.workingSet!);
    const trigger = triggerRef.current;
    setEditorOpen(false);
    context?.onSaved(doneMessage(title, action.membership, counts));
    if (!trigger?.isConnected) focusVisibleBubble(paperId, scope);
  }

  return (
      <button
        ref={triggerRef}
        type="button"
        data-membership-paper={paperId}
        aria-label={bubbleAriaLabel(title, member)}
      >
        <span aria-hidden="true" data-membership-dot className={`box-border h-2.5 w-2.5 shrink-0 ${DOT_CLASS[membershipDot(member)]}`} />
        <span>{membershipShortLabel(member)}</span>
      </button>
  );
}
