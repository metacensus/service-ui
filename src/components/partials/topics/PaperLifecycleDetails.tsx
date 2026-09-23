import { cn } from "@/lib/utils";
import { styles } from "@/styles";

  </span>;
}

  return <div className="space-y-6 min-w-0">
    <section aria-label="Lifecycle status" className="space-y-3">
      <h2 className="font-semibold">Lifecycle status</h2>
    </section>
      <h2 className="font-semibold">Required review tasks</h2>
    <section className="space-y-3 break-words" aria-label="Details">
      <h2 className="font-semibold">Details</h2>
      <p>{paper.title}</p>
      <p className="text-sm whitespace-pre-wrap">{paper.abstract || "No abstract available."}</p>
      {paper.doi && <p className="text-sm">DOI: {paper.doi}</p>}
      {paper.pmid && <p className="text-sm">PMID: {paper.pmid}</p>}
      {paper.fullTextUrl && <p className="text-sm">Full text: {paper.fullTextUrl}</p>}
    </section>
  </div>;
}

    <summary className={cn(styles.focusRing, "cursor-pointer rounded")}>
      <span className="flex flex-col gap-2 min-w-0">
        <summary className={cn(styles.focusRing, "cursor-pointer")}>Confident extractions ({clean.length})</summary>
  return <div className="border-b pb-2 break-words">
  </div>;
}
