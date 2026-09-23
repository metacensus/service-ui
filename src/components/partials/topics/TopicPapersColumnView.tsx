import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { Paper } from "../../../../types/Paper";
import TopicPaperCard from "./TopicPaperCard";
import { getPaperLifecycleStage, getPaperStatusCount, PAPER_LIFECYCLE_STAGES } from "@/functions/getPaperStatusCount";
import { fetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";

  const openingCard = useRef<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const uniquePapers = [...new Map(papers.map(paper => [paper.id, paper])).values()];
  const selected = uniquePapers.find(paper => paper.id === selectedId);
  async function accept(paper: Paper) {
    if (accepting !== null) return;
    setAccepting(paper.id); setError(null);
    try {
      await fetchData(routes.api.paperAccept(String(paper.id)), "POST", {});
      await queryClient.invalidateQueries({ predicate: query => String(query.queryKey[0]).startsWith("topics-papers-") });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Acceptance failed. Please try again."); }
    finally { setAccepting(null); }
  }
  return <>
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 mt-6 w-full gap-4">
      {PAPER_LIFECYCLE_STAGES.map(stage => <section className="min-w-0" key={stage} aria-label={stage}>
        <h2 className="text-base font-semibold mb-1">{stage}</h2>
        <div className="flex flex-col gap-3">
        </div>
      </section>)}
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <div className="flex justify-between items-center gap-4 mb-5">
            <Dialog.Title className="text-xl font-semibold">Paper details</Dialog.Title>
            <Dialog.Close className={cn(styles.focusRing, "rounded border px-3 py-1")}>Close</Dialog.Close>
          </div>
          {selected && <>
              <button type="button" disabled={accepting !== null} onClick={() => accept(selected)}
                {accepting === selected.id ? "Accepting…" : "Accept for full-text review"}
              </button>}
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
