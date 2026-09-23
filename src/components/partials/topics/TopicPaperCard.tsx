"use client";
import { cn } from "@/lib/utils";
import { PaperMembership } from "./PaperLifecycleDetails";
import { styles } from "@/styles";

}) {
  return <article role="button" tabIndex={0} aria-label={`Paper details: ${paper.title}`}
    onClick={event => onOpen(event.currentTarget)}
    onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(event.currentTarget); }
    }}
    <h3 className="text-sm font-medium">{paper.title}</h3>
      <button type="button" disabled={accepting !== null}
        onClick={event => { event.stopPropagation(); onAccept(); }}>
        {accepting === paper.id ? "Accepting…" : "Accept for full-text review"}
      </button>}
  </article>;
}
