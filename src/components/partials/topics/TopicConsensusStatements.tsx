import TablePagination from "@/components/shared/TablePagination";
import TableSimple from "@/components/shared/TableSimple";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { sameEntityId } from "@/lib/entityId";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Prop } from "../../../../types/Prop";
import StatementVote from "./StatementVote";
import StatementVoteStatus from "./StatementVoteStatus";
import { ChevronDown } from "lucide-react";

interface Props {
  statements: Prop[];
  page: number;
  setPage: (page: number) => void;
  topicId: string;
}

const TopicConsensusStatementTable = ({
  statements,
  page,
  setPage,
  topicId,
}: Props) => {
  const [sortNewest, setSortNewest] = useState(true); // true for newest first, false for oldest

  const { data: contributors } = useUsers();

  const columns = useMemo(() => {
    const toggleSort = () => {
      setSortNewest(!sortNewest);
    };
    return [
      {
        content: (
          <div className="flex items-center gap-2">
            <span>Consensus Statements</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleSort}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !sortNewest && "rotate-180"
                )}
              >
                <title>{sortNewest ? "Newest First" : "Oldest First"}</title>
              </ChevronDown>
            </Button>
          </div>
        ),
        className: "text-lg",
        columnId: "statements",
      },
      {
        content: <span>Author</span>,
        className: "text-lg",
        columnId: "author",
      },

      {
        content: <span>Current Votes</span>,
        className: "text-lg",
        columnId: "votes",
      },
      {
        content: <span>Vote</span>,
        className: "text-lg",
        columnId: "vote",
      },
    ];
  }, [sortNewest]);

  const sortedStatements = useMemo(() => {
    if (!statements) return [];
    return [...statements].sort((a, b) => {
      const dateA = new Date(a.recorded ?? 0).getTime();
      const dateB = new Date(b.recorded ?? 0).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
  }, [statements, sortNewest]);

  const rows = useMemo(
    () =>
      (sortedStatements &&
        sortedStatements.map((statement) => [
          {
            content: <span className="py-4">{statement.description}</span>,
            className: "text-wrap",
            columnId: "statements",
          },

          {
            content: () => {
              const authorName = contributors?.find((contributor) =>
                sameEntityId(contributor.id, statement.authorId)
              )?.name;
              return <span className="py-4">{authorName}</span>;
            },

            className: "text-wrap",
            columnId: "author",
          },

          {
            content: (
              <div className="flex gap-2">
                <StatementVoteStatus
                  propId={statement.id}
                  topicId={topicId}
                  statement={statement}
                />
              </div>
            ),
            className: "",
            columnId: "votes",
          },

          {
            content: (
              <StatementVote topicId={topicId} prop={statement} />
            ),
            className: "",
            columnId: "vote",
          },
        ])) ||
      [],
    [contributors, sortedStatements, topicId]
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

export default TopicConsensusStatementTable;
