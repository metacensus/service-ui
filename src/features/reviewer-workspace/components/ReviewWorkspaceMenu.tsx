"use client";

import { useState } from "react";
import { Download, MoreVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ReviewComment,
  StoredReviewAction,
} from "../types";

type ReviewWorkspaceMenuProps = {
  runId: string;
  reviewerName: string | null;
  actions: StoredReviewAction[];
  actionHistory: StoredReviewAction[];
  comments: ReviewComment[];
  onReset: () => Promise<unknown>;
};

const ReviewWorkspaceMenu = ({
  runId,
  reviewerName,
  actions,
  actionHistory,
  comments,
  onReset,
}: ReviewWorkspaceMenuProps) => {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const exportReview = () => {
    const payload = {
      run_id: runId,
      exported_at: new Date().toISOString(),
      reviewer: reviewerName,
      actions,
      action_history: actionHistory,
      comments,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${runId}-review-actions.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const reset = async () => {
    setResetting(true);
    try {
      await onReset();
      setConfirmingReset(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => !open && setConfirmingReset(false)}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title="Review workspace menu"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Review workspace menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Review workspace</DropdownMenuLabel>
        <DropdownMenuItem onSelect={exportReview}>
          <Download className="mr-2 h-4 w-4" />
          Export review JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {confirmingReset ? (
          <DropdownMenuItem
            className="text-mc-alert-ink focus:text-mc-alert-ink"
            disabled={resetting}
            onSelect={(event) => {
              event.preventDefault();
              void reset();
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetting ? "Resetting..." : "Confirm reset"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setConfirmingReset(true);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset local review state
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReviewWorkspaceMenu;
