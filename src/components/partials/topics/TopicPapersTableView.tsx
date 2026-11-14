"use client";
import TablePagination from "@/components/shared/TablePagination";
import TableSimple from "@/components/shared/TableSimple";
import { getPaperLifecycleStage } from "@/functions/getPaperStatusCount";
import Link from "@/components/shared/Link";
import { usePathname } from "@/lib/next-navigation-compat";
import { useMemo } from "react";
import { Paper } from "../../../../types/Paper";
import { getPaperVoteCount } from "@/functions/getPaperVoteCount";
import { PaperMembership } from "./PaperLifecycleDetails";
import CardIndicators from "../CardIndicators";
import type { PapersReview } from "@/hooks/usePaperReviewProgress";
import type { PapersMembership } from "@/hooks/usePapersMembership";
import { Search, ThumbsDown, ThumbsUp } from "lucide-react";

interface Props {
  papers: Paper[];
  page: number;
  setPage: (page: number) => void;
  review: PapersReview;
  membership: PapersMembership;
}

const TopicPapersTableView = ({ papers, page, setPage, review, membership }: Props) => {
  const pathname = usePathname();

  const columns = useMemo(
    () => [
      {
        content: <span>Papers</span>,
        className: "text-lg",
        columnId: "papers",
      },
      {
        content: <span>Reviews</span>,
        className: "text-lg",
        columnId: "reviews",
      },
      {
        content: <span>Votes</span>,
        className: "text-lg",
        columnId: "votes",
      },
      {
        content: <span>Status</span>,
        className: "text-lg",
        columnId: "status",
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      (papers &&
        papers.map((paper) => {
          // Placement is unknown while Review loads, so no membership badge then.
          const stage = review.status === "loading" ? null : getPaperLifecycleStage(paper, review.isAdjudicated(paper));
          return [
          {
            content: (
              <Link className="w-full" href={`${pathname}/${paper.id}`}>
                <span className="py-4">{paper.title}</span>
              </Link>
            ),
            className: "text-wrap",
            columnId: "paper",
          },
          {
            content: (
              <CardIndicators
                icon={<Search className="h-4 w-4" />}
                count={+paper?.paperContributors?.length || 0}
                name="reviewers"
                textSize="text-sm"
              />
            ),
            className: "",
            columnId: "reviews",
          },
          {
            content: (
              <div className="flex gap-2">
                <CardIndicators
                  icon={<ThumbsUp className="h-4 w-4" />}
                  count={getPaperVoteCount(paper, "approval")}
                  textSize="text-sm"
                />
                <CardIndicators
                  icon={<ThumbsDown className="h-4 w-4" />}
                  count={getPaperVoteCount(paper, "rejection")}
                  textSize="text-sm"
                />
              </div>
            ),
            className: "",
            columnId: "votes",
          },

          {
            content: (
              <div className="">
                <p>{stage ?? "Loading…"}</p>
                <PaperMembership membership={membership.membershipFor(paper)} stage={stage} />
              </div>
            ),
            className: "",
            columnId: "reviewers",
          },
        ];
        })) ||
      [],
    [papers, pathname, review, membership]
  );

  return (
    <div className="w-full flex flex-col gap-2">
      <TableSimple columns={columns} rows={rows} tableTitle="" />
      <TablePagination
        decrementPage={() => {
          if (page > 1) setPage(page - 1);
        }}
        incrementPage={() => {
          setPage(page + 1);
        }}
      />
    </div>
  );
};

export default TopicPapersTableView;
