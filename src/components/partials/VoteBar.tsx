import { cn } from "@/lib/utils";
import { tallyPercents, type VoteTally } from "./voteTally";

type VoteBarProps = {
  tally: VoteTally;
  className?: string;
  /** Show the For / Abstain / Against counts under the bar. */
  showLegend?: boolean;
};

/** A three-colour bar of how a proposition's votes split. */
const VoteBar = ({ tally, className, showLegend = true }: VoteBarProps) => {
  const pct = tallyPercents(tally);
  const label = `${tally.for} for, ${tally.abstain} abstain, ${tally.against} against`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        role="img"
        aria-label={tally.total ? label : "No votes cast yet"}
      >
        <div className="bg-emerald-500" style={{ width: `${pct.for}%` }} />
        <div className="bg-gray-400" style={{ width: `${pct.abstain}%` }} />
        <div className="bg-rose-500" style={{ width: `${pct.against}%` }} />
      </div>
      {showLegend && (
          {tally.total === 0 ? (
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {tally.for} for
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                {tally.abstain} abstain
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {tally.against} against
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoteBar;
