import { Paper } from "../../types/Paper";

export const getPaperVoteCount = (
  paper: Paper,
  type: "approval" | "rejection"
): number => {
  const { paperApprovalsRejections } = paper;

  if (!paperApprovalsRejections || paperApprovalsRejections.length === 0) {
    return 0;
  }

  const isApproval = type === "approval";

  return paperApprovalsRejections.reduce((total, approvalRejection) => {
    return approvalRejection.approval === isApproval ? total + 1 : total;
  }, 0);
};
