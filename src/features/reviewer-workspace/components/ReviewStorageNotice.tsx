import { AlertTriangle } from "lucide-react";

const ReviewStorageNotice = ({ mode }: { mode: "persistent" | "memory" }) => {
  if (mode !== "memory") return null;

  return (
    <div
      className="mt-4 flex items-start gap-2 mc-notice text-sm"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Review decisions are only saved for this browser session. Keep this
        tab open until you have exported your review.
      </span>
    </div>
  );
};

export default ReviewStorageNotice;
