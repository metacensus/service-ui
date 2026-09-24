"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/lib/next-navigation-compat";
import { pdfUrl } from "../data/snapshot";
import { unitHrefWithOrigin, type ReviewOrigin } from "../model/returnContext";
import {
  buildTaskDecisionActions,
  shouldAdvanceAfterDecision,
} from "../model/reviewTaskDecisions";
import {
  questionDetail,
  questionEvidence,
  taskDecisionHistory,
  taskFirstQuote,
  taskQuestionStates,
} from "../model/reviewTaskPage";
import {
  nextUndecidedTask,
  type ReviewTask,
  type ReviewTaskRow,
} from "../model/reviewTasks";
import type {
  CorrectedPayload,
  NewReviewComment,
  ReviewAction,
  ReviewComment,
  StoredReviewAction,
} from "../types";
import ActionControls from "./ActionControls";
import CommentThread from "./CommentThread";
import EvidencePanel from "./EvidencePanel";
import ReviewerIdentityControl from "./ReviewerIdentityControl";
import ReviewTaskQuestionList, { QuestionRowsToggle } from "./ReviewTaskQuestionList";
import ReviewValueDetail from "./ReviewValueDetail";

type ReviewTaskViewProps = {
  runId: string;
  base: string;
  origin: ReviewOrigin | null;
  /** The landing, where the view goes when no task is next. */
  backHref: string;
  doc: ReviewTasksDocument;
  detail: ReviewTaskDetail;
  task: ReviewTask;
  includeNonAmbiguous: boolean;
  fieldTypes: ReadonlyMap<string, string | null>;
  actions: StoredReviewAction[];
  actionHistory: StoredReviewAction[];
  comments: ReviewComment[];
  reviewerName: string | null;
  setReviewerName: (name: string) => Promise<unknown>;
  bulkUpsertActions: (actions: ReviewAction[]) => Promise<unknown>;
  addComment: (comment: NewReviewComment) => Promise<unknown>;
};

const ReviewTaskView = ({
  runId,
  base,
  origin,
  backHref,
  doc,
  detail,
  task,
  includeNonAmbiguous,
  fieldTypes,
  actions,
  actionHistory,
  comments,
  reviewerName,
  setReviewerName,
  bulkUpsertActions,
  addComment,
}: ReviewTaskViewProps) => {
  const router = useRouter();
  const paperId = doc.paper_id;
  const n = detail.questions.length;
  const single = n === 1;
  const states = useMemo(
  );
  const questionMembers = useMemo(() => taskQuestionMembers(detail), [detail]);
  const rowEntries = questionMembers.reduce((sum, members) => sum + members.length, 0);
  const decidedCount = states.filter(isDecided).length;

  const checkedEntries = checkedIdx.reduce((sum, i) => sum + questionMembers[i].length, 0);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [singleRowsOpen, setSingleRowsOpen] = useState(false);

  const focus = focusIdx ?? 0;
  const focusDetail = questionDetail(doc, detail, focus);
  const evidence =
    activeQuote ??
    (focusIdx !== null ? questionEvidence(doc, detail, focusIdx) : taskFirstQuote(doc, detail));


  const oneChecked = checkedIdx.length === 1 ? checkedIdx[0] : null;
  const oneCheckedDetail = oneChecked !== null ? questionDetail(doc, detail, oneChecked) : null;

  const history = useMemo(
  );

  const decide = async (decision: TaskDecision) => {
    const reviewer = reviewerName?.trim();
    const scope: readonly number[] | "all" = single ? "all" : checkedIdx;
    if (!reviewer) return;
    if (scope !== "all" && scope.length === 0) return;
    if (decision.action === "correct" && scope !== "all" && scope.length !== 1) return;
    const before = actions;
    await bulkUpsertActions(
      buildTaskDecisionActions(doc, detail, scope, decision, runId, reviewer)
    );
    if (scope !== "all") {
      setChecked((prev) => {
        const next = new Set(prev);
        for (const i of scope) next.delete(i);
        return next;
      });
    }
      const next = nextUndecidedTask(queue, includeNonAmbiguous, detail.id);
      router.push(next ? unitHrefWithOrigin(base, next.task.id, origin) : backHref);
    }
  };

  const taskComments = comments.filter((comment) => comment.unit_id === detail.id);

  return (
    <div data-testid="review-task" className="min-w-0">
      <div
        data-testid="task-header"
        className={`mt-6 rounded-lg border border-l-4 ${accent.border} bg-white p-5 shadow-sm`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-64">
            <span data-testid="task-header-kind" className={`text-xs font-bold ${accent.text}`}>
              {REVIEW_TASK_KIND_HEADINGS[detail.kind]}
            </span>
            <h1
              data-testid="task-header-title"
              className="mt-2 font-bold text-2xl [overflow-wrap:anywhere]"
            >
              {task.paperLabel} · {detail.title}
            </h1>
            {detail.source_line && (
              <p
                data-testid="task-header-source"
              >
                {detail.source_line}
              </p>
            )}
            <p
              data-testid="task-header-questions"
            >
              {single
                ? `1 question${
                    rowEntries > 1
                      ? ` · it applies to ${rowEntries.toLocaleString("en-US")} rows; the decision covers every one.`
                      : "."
                  }`
                : `${count(n, "question", "questions")}${
                    detail.citations.length > 1
                      ? `, all citing the same ${detail.citations.length.toLocaleString("en-US")} quotes`
                      : ""
                  } (${count(rowEntries, "row entry", "row entries")}) · a decision covers the questions you check; the rest stay open.`}
            </p>
              <div data-testid="task-single-rows" className="-mx-2 mt-1">
                <QuestionRowsToggle
                  doc={doc}
                  task={detail}
                  questionIndex={0}
                  open={singleRowsOpen}
                  onToggle={() => setSingleRowsOpen((open) => !open)}
                  bounded
                />
              </div>
            )}
          </div>
          <div className="flex w-full min-w-0 flex-col items-start gap-2 max-xl:[&_form]:w-full max-xl:[&_form]:min-w-0 max-xl:[&_form]:flex-wrap max-xl:[&_label]:min-w-0 max-xl:[&_input]:w-full max-xl:[&_input]:min-w-0 max-xl:[&_input]:flex-1 max-xl:[&_input]:shrink max-xl:[&_button]:shrink-0 xl:w-auto xl:items-end">
            <ReviewerIdentityControl reviewerName={reviewerName} onSave={setReviewerName} />
              {decidedCount.toLocaleString("en-US")}/{n.toLocaleString("en-US")}{" "}
              {n === 1 ? "question" : "questions"} decided
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-4 xl:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-4 xl:w-1/2">
          {!single && (
            <ReviewTaskQuestionList
              doc={doc}
              task={detail}
              states={states}
              checked={checked}
              onCheckedChange={setChecked}
              focus={focusIdx}
              onFocus={(i) => {
                setFocusIdx(i);
                setActiveQuote(null);
              }}
            />
          )}

          <div data-testid="task-focus" className="rounded-lg border bg-white p-4 shadow-sm">
              {n === 1 ? "Question" : `Question ${(focus + 1).toLocaleString("en-US")} of ${n.toLocaleString("en-US")}`}
            </div>
            <div className="mt-3">
              <div
                data-testid="decision-question"
                className="rounded-lg border bg-white p-4 shadow-sm [overflow-wrap:anywhere]"
              >
                <div
                  data-testid="task-focus-question"
                >
                </div>
              </div>
            </div>
          </div>

          {focusDetail && (
            <ReviewValueDetail
              sources={focusDetail.sources}
              derivation={focusDetail.derivation}
              reasoning={focusDetail.reasoning}
              activeSource={evidence}
              onSourceSelect={setActiveQuote}
            />
          )}

          <div data-testid="task-decision" className="rounded-lg border bg-white p-4 shadow-sm">
              {single ? "Your decision on this value" : "Your decision on the checked questions"}
            </div>
            {!single && (
                Applies to the {count(checkedIdx.length, "checked question", "checked questions")}
                {checkedIdx.length > 0 && ` (${count(checkedEntries, "row entry", "row entries")})`}.{" "}
                {(n - decidedCount).toLocaleString("en-US")} of {n.toLocaleString("en-US")} still open;
                unchecked questions stay open.
              </p>
            )}
            <div className="mt-3">
              <ActionControls
                state={taskState}
                reviewerName={reviewerName}
                fieldType={
                }
                onApprove={() => decide({ action: "approve" })}
                onCorrect={(corrected: CorrectedPayload) => decide({ action: "correct", corrected })}
                onFlag={(reason) => decide({ action: "flag", reason })}
              />
              {history.length > 0 && (
                <details data-testid="task-history" className="mt-4 border-t pt-3">
                    Decision history ({history.length})
                  </summary>
                  <ol className="mt-2 space-y-2">
                    {history.map((entry) => (
                      <li
                        key={`${entry.action}|${entry.reviewedAt}|${entry.reviewedBy}`}
                      >
                          {entry.action.replace(/_/g, " ")}
                        </strong>{" "}
                        by {entry.reviewedBy} · {new Date(entry.reviewedAt).toLocaleString()} ·{" "}
                        {count(entry.rowEntries, "row entry", "row entries")}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mt-3">
              <CommentThread
                comments={taskComments}
                reviewerName={reviewerName}
                onAdd={(text) =>
                  addComment({
                    run_id: runId,
                    paper_id: paperId,
                    row_index: null,
                    field: null,
                    unit_id: detail.id,
                    author: reviewerName?.trim() || "anonymous",
                    text,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 xl:w-1/2">
          <div className="max-h-screen xl:sticky xl:top-4">
            {pdfPath ? (
              <EvidencePanel
                runId={runId}
                paperId={paperId}
                pdfUrl={pdfUrl(runId, pdfPath)}
                source={evidence}
              />
            ) : (
                No source document for this task.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewTaskView;
