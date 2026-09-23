import { PAPER_LIFECYCLE_STAGES, type Paper, type PaperLifecycleStage, type PaperStatus } from "../../types/Paper";

export { PAPER_LIFECYCLE_STAGES };

}

  if (!PAPER_LIFECYCLE_STAGES.includes(status as PaperLifecycleStage)) {
    return (papers ?? []).filter(paper => paper.status === status).length;
  }
  return [...new Map((papers ?? []).map(paper => [paper.id, paper])).values()]
};
