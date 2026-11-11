"use client";
import { cn } from "@/lib/utils";
import { Paper, type PaperLifecycleStage } from "../../../../types/Paper";
import { PaperMembership } from "./PaperLifecycleDetails";
import type { PaperMembershipStatus } from "@/functions/paperMembership";
import { styles } from "@/styles";

export default function TopicPaperCard({ paper, stage, membership, onOpen, onAccept, accepting }: {
  paper: Paper; stage: PaperLifecycleStage; membership: PaperMembershipStatus; onOpen: (card: HTMLElement) => void; onAccept: () => void; accepting: number | null;
}) {
  return <article role="button" tabIndex={0} aria-label={`Paper details: ${paper.title}`}
    onClick={event => onOpen(event.currentTarget)}
    onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(event.currentTarget); }
    }}
    className={cn(styles.focusRing, "rounded-lg border bg-card p-4 space-y-3 cursor-pointer focus-visible:outline-offset-2")}>
    <h3 className="text-sm font-medium">{paper.title}</h3>
    <PaperMembership membership={membership} stage={stage} />
    {stage === "Abstracts Gathered" &&
      <button type="button" disabled={accepting !== null}
        className={cn(styles.focusRing, "block rounded border border-mc-ink-accent px-3 py-2 text-sm text-mc-ink-accent disabled:opacity-50")}
        onClick={event => { event.stopPropagation(); onAccept(); }}>
        {accepting === paper.id ? "Accepting…" : "Accept for full-text review"}
      </button>}
  </article>;
}
