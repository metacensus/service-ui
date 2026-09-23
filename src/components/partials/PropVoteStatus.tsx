"use client";

import formatIsoDate from "@/functions/formatIsoDate";
import { useFetchData } from "@/hooks/useFetchData";
import { sameEntityId } from "@/lib/entityId";
import { routes } from "@/lib/routes";
import { useState } from "react";
import { Contributor } from "../../../types/Contributor";
import { Prop } from "../../../types/Prop";
import { Vote } from "../../../types/vote";
import MyDrawer from "../shared/Drawer";
import TableSimple from "../shared/TableSimple";
import { Button } from "../ui/button";
import CardIndicators from "./CardIndicators";
import { StatementHeatmap } from "./StatementHeatmap";
import {
  excerptForCitation,
  parseStatementCitation,
} from "./statementCitations";

type PropVoteStatusProps = {
  votes: Vote[];
  prop?: Prop;
};

const PropVoteStatus = ({ votes, prop }: PropVoteStatusProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getCounts = (type: "For" | "Against" | "Abstain") => {
    return votes.reduce((acc, vote) => {
      return vote.position === type ? acc + 1 : acc;
    }, 0);
  };

  const { data: contributors } = useFetchData<undefined, Contributor[]>(
    `${routes.api.user}`,
    ["contributors"],
    "GET"
  );

  return (
    <div>
      <div className="flex gap-2">
        <CardIndicators
          count={getCounts("For")}
          textSize="text-sm"
        />
        <CardIndicators
          count={getCounts("Against")}
          textSize="text-sm"
        />
        <CardIndicators
          count={getCounts("Abstain")}
          textSize="text-sm"
        />
      </div>
      {votes.length > 0 && (
        <>
          <div className="mt-4">
            <Button
              onClick={() => setIsDrawerOpen(true)}
              variant="outline"
              size="sm"
            >
              View Votes
            </Button>
          </div>

          <MyDrawer open={isDrawerOpen} setOpen={setIsDrawerOpen} title="Votes">
            <div className="grid gap-4">
              {prop?.description && (
                <StatementHeatmap votes={votes} statement={prop.description} />
              )}
              <TableSimple
                columns={[
                  {
                    content: "Contributor",
                    className: "",
                    columnId: "contributor",
                  },
                  {
                    content: "Position",
                    className: "",
                    columnId: "position",
                  },
                  {
                    content: "Explanation",
                    className: "",
                    columnId: "explanation",
                  },
                ]}
                rows={votes.map((vote) => {
                  const user = contributors?.find((contributor) =>
                    sameEntityId(contributor.id, vote.userId)
                  );
                  const citationExcerpt = prop?.description
                    ? excerptForCitation({
                        statement: prop.description,
                        citation: parseStatementCitation(vote.citations?.[0]),
                      })
                    : "";

                  return [
                    {
                      content: user?.name,
                      className: "",
                      columnId: "contributor",
                    },
                    {
                      content: vote.position,
                      className: "",
                      columnId: "position",
                    },
                    {
                      content: (
                        <span>
                          {vote.explanation}
                          {citationExcerpt ? (
                            <>
                              <br />
                                &ldquo;{citationExcerpt}&rdquo;
                              </span>
                            </>
                          ) : null}
                          <br />
                            {formatIsoDate(vote.lastCast)}
                          </span>
                        </span>
                      ),
                      className: "",
                      columnId: "explanation",
                    },
                  ];
                })}
              />
            </div>
          </MyDrawer>
        </>
      )}
    </div>
  );
};

export default PropVoteStatus;
