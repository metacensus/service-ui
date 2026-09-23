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

interface Props {
  papers: Paper[];
  page: number;
  setPage: (page: number) => void;
}

  const pathname = usePathname();

  const columns = useMemo(
    () => [
      {
        content: <span>Papers</span>,
        columnId: "papers",
      },
      {
        content: <span>Reviews</span>,
        columnId: "reviews",
      },
      {
        content: <span>Votes</span>,
        columnId: "votes",
      },
      {
        content: <span>Status</span>,
        columnId: "status",
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      (papers &&
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
                  count={getPaperVoteCount(paper, "approval")}
                  textSize="text-sm"
                />
                <CardIndicators
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
              </div>
            ),
            className: "",
            columnId: "reviewers",
          },
      [],
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
