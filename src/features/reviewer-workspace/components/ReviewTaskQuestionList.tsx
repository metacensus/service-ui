"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReviewTaskDetail, ReviewTasksDocument } from "../data/reviewIndex";
import { count } from "../model/display";
import {
  openQuestions,
  questionLabel,
  questionRowCount,
  questionRowHeaders,
  taskQuestionSections,
} from "../model/reviewTaskPage";
import type { RowReviewState } from "../model/rowStatus";

type ReviewTaskQuestionListProps = {
  doc: ReviewTasksDocument;
  task: ReviewTaskDetail;
  states: RowReviewState[];
  checked: ReadonlySet<number>;
  onCheckedChange: (checked: Set<number>) => void;
  focus: number | null;
  onFocus: (questionIndex: number) => void;
};

const toggle = (set: ReadonlySet<number>, i: number) => {
  const next = new Set(set);
  if (next.has(i)) next.delete(i);
  else next.add(i);
  return next;
};

type QuestionRowsToggleProps = {
  doc: ReviewTasksDocument;
  task: ReviewTaskDetail;
  questionIndex: number;
  open: boolean;
  onToggle: () => void;
  /** Cap the list's height (the one-question header can list many rows). */
  bounded?: boolean;
};

export const QuestionRowsToggle = ({
  doc,
  task,
  questionIndex,
  open,
  onToggle,
  bounded = false,
}: QuestionRowsToggleProps) => {
  const spans = questionRowHeaders(doc, task, task.questions[questionIndex]);
  if (!spans) return null;
  const listId = `question-rows-${questionIndex}`;
  return (
    <div className="px-2 pb-1">
      <button
        type="button"
        data-testid="task-question-rows-toggle"
        aria-expanded={open}
        aria-controls={listId}
        className="text-xs font-bold text-mc-ink-accent hover:underline"
        onClick={onToggle}
      >
        {open ? "▾" : "▸"} applies to {count(questionRowCount(task, questionIndex), "row", "rows")}
      </button>
      {open && (
        <ul
          id={listId}
          data-testid="task-question-row-headers"
          className={`mt-1 flex flex-col gap-1 border-l-2 border-border pl-3 ${
            bounded ? "max-h-72 overflow-y-auto" : ""
          }`}
        >
          {spans.map(({ header, rows }, k) => (
            <li
              key={k}
              title={header?.full || undefined}
              className="text-xs [overflow-wrap:anywhere]"
            >
              <span className="text-foreground">{header?.text ?? "Row"}</span>
              {rows > 1 && <span className="text-muted-foreground"> · {count(rows, "row", "rows")}</span>}
              {header?.detail && <div className="text-muted-foreground">{header.detail}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ReviewTaskQuestionList = ({
  doc,
  task,
  states,
  checked,
  onCheckedChange,
  focus,
  onFocus,
}: ReviewTaskQuestionListProps) => {
  const [openRows, setOpenRows] = useState<ReadonlySet<number>>(() => new Set());
  const sections = useMemo(() => taskQuestionSections(doc, task), [doc, task]);
  const n = task.questions.length;
  const studyWide = doc.study_wide.context;
  const shared = task.shared_context ?? "";

  const rowsToggle = (i: number) => (
    <QuestionRowsToggle
      doc={doc}
      task={task}
      questionIndex={i}
      open={openRows.has(i)}
      onToggle={() => setOpenRows((prev) => toggle(prev, i))}
    />
  );

  const questionItem = (i: number) => {
    const question = task.questions[i];
    const state = states[i];
    const isFocus = focus === i;
    const label = questionLabel(question);
    const rows = questionRowCount(task, i);
    const spans = questionRowHeaders(doc, task, question);
    return (
      <li key={i} className="flex min-w-0 items-start gap-2 pl-2">
        <input
          type="checkbox"
          data-testid="task-question-check"
          aria-label={`Include ${label} in the decision`}
          className="mt-2 h-4 w-4 shrink-0"
          checked={checked.has(i)}
          onChange={() => onCheckedChange(toggle(checked, i))}
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            data-testid="task-question"
            aria-current={isFocus ? "true" : undefined}
            onClick={() => onFocus(i)}
            className={`flex w-full min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-left text-sm ${
              isFocus ? "bg-secondary" : "hover:bg-secondary/50"
            }`}
          >
            <span
              data-testid="task-question-text"
              className="min-w-0 flex-1 basis-48 text-foreground [overflow-wrap:anywhere]"
              title={question.field}
            >
              {label}
            </span>
            {rows > 1 && !spans && (
              <span className="shrink-0 text-xs text-muted-foreground">
                applies to {count(rows, "row", "rows")}
              </span>
            )}
            {state !== "open" && (
              <span
                data-testid="task-question-state"
                className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-foreground"
              >
                {state}
              </span>
            )}
            {question.basis && (
              <span
                data-testid="task-question-basis"
                className="basis-full text-xs text-muted-foreground [overflow-wrap:anywhere]"
              >
                {question.basis}
              </span>
            )}
          </button>
          {rowsToggle(i)}
        </div>
      </li>
    );
  };

  return (
    <div data-testid="task-questions" className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="text-xs font-bold uppercase text-muted-foreground">
          Questions in this task ({n.toLocaleString("en-US")})
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            data-testid="select-all"
            className="font-bold text-mc-ink-accent hover:underline"
            title="Checks every question not yet approved or corrected; a decided question is re-decided only by checking it on its own"
            onClick={() => onCheckedChange(new Set(openQuestions(states)))}
          >
            Select all
          </button>
          <span className="text-mc-ink-secondary">·</span>
          <button
            type="button"
            data-testid="unselect-all"
            className="font-bold text-mc-ink-accent hover:underline"
            onClick={() => onCheckedChange(new Set())}
          >
            Unselect all
          </button>
          <span data-testid="checked-count" className="text-muted-foreground">
            {checked.size.toLocaleString("en-US")} of {n.toLocaleString("en-US")} checked
          </span>
        </div>
      </div>
      {(shared || studyWide.length > 0) && (
        <p
          data-testid="task-shared-context"
          className="mt-2 text-xs text-muted-foreground [overflow-wrap:anywhere]"
          title={doc.study_wide.full.join("\n") || undefined}
        >
          {studyWide.length > 0 && (
            <>
              <span className="font-bold text-foreground">Study-wide:</span> {studyWide.join(" · ")}
              {shared && " · "}
            </>
          )}
          {shared && (
            <>
              <span className="font-bold text-foreground">Every row here:</span> {shared}
            </>
          )}
        </p>
      )}
      <ol className="mt-2 flex max-h-96 flex-col overflow-y-auto">
        {sections.map(({ header, questionIndexes }, s) => (
          <Fragment key={s}>
            {header && (
              <li
                data-testid="task-row-header"
                data-state={header.state}
                title={header.full || undefined}
                className="mt-2 border-t px-2 pt-2 first:mt-0 first:border-t-0 first:pt-0"
              >
                <div className="text-xs font-bold text-foreground [overflow-wrap:anywhere]">
                  {header.text}
                  {header.state === "several" && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · same answer on rows with different headers; one decision covers every row
                    </span>
                  )}
                  {header.rows > 1 && (
                    <span className="font-normal text-muted-foreground"> · {count(header.rows, "row", "rows")}</span>
                  )}
                </div>
                {header.detail && (
                  <div className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{header.detail}</div>
                )}
              </li>
            )}
            {questionIndexes.map(questionItem)}
          </Fragment>
        ))}
      </ol>
    </div>
  );
};

export default ReviewTaskQuestionList;
