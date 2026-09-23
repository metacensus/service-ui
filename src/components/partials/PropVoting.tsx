import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import { useFetchData } from "@/hooks/useFetchData";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Prop } from "../../../types/Prop";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  excerptForCitation,
  selectionOffsetsWithin,
  type StatementCitation,
} from "./statementCitations";

type PropVotingProps = {
  topicId: string;
  propId: string;
  handleClose?: () => void;
  userVote?: unknown;
};

const votingOptionMap = {
  accept: "For",
  reject: "Against",
  abstain: "Abstain",
} as const;

type VotingOption = (typeof votingOptionMap)[keyof typeof votingOptionMap];

const votingOptions = Object.values(votingOptionMap);

function parseVotingOption(value: string): VotingOption | "" {
  return votingOptions.find((option) => option === value) ?? "";
}

const PropVoting = ({
  topicId,
  propId,
  handleClose,
  userVote,
}: PropVotingProps) => {
  const { toast } = useToast();
  const statementRef = useRef<HTMLParagraphElement>(null);

  const [votingComment, setVotingComment] = useState("");
  const [votingOption, setVotingOption] = useState<VotingOption | "">("");
  const [selection, setSelection] = useState<StatementCitation | undefined>(
    undefined
  );

  const { data: propsData } = useFetchData<undefined, Prop[]>(
    `${routes.api.topic}/${topicId}/prop`,
    [`statements-${topicId}`],
    "GET"
  );

  const prop =
    propsData
      ?.filter((item) => item.type === "Statement")
      .find((item) => item.id === propId) || null;

  const handleSubmitVote = async () => {
    if (!propId || !votingOption || !topicId) {
      return;
    }

    const body: {
      position: string;
      explanation: string;
      citations?: StatementCitation[];
    } = {
      position: votingOption,
      explanation: votingComment,
    };

    // Citations are meaningful for Against only (contract).
    if (votingOption === votingOptionMap.reject && selection) {
      body.citations = [selection];
    }

    if (window.confirm("Are you sure you want to cast your vote?")) {

      const request = await fetch(
        `${routes.api.topic}/${topicId}/prop/${propId}/vote`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!request.ok) {
        let description = "Your vote could not be submitted.";
        try {
          const responseJson = await request.json();
          description =
            responseJson.error || responseJson.message || description;
        } catch {
          // keep the default description when the body is not JSON
        }
        toast({
          title: "Vote failed",
          description,
          variant: "destructive",
        });
        return;
      }

      await request.json();
      await queryClient.invalidateQueries({
        queryKey: [`meta-vote-${topicId}`],
      });

      await queryClient.invalidateQueries({
        queryKey: [`statement-${propId}-${topicId}`],
      });

      await queryClient.invalidateQueries({
        queryKey: [`statement-${propId}-${topicId}-vote`],
      });
      toast({
        title: "Vote submitted",
        description: "Your vote has been submitted successfully",
      });

      setVotingOption("");
      setVotingComment("");
      setSelection(undefined);
      handleClose && handleClose();
    }
  };

  useEffect(() => {
    if (votingOption !== votingOptionMap.reject) setSelection(undefined);
  }, [votingOption]);

  const selectedText = useMemo(
    () =>
      excerptForCitation({
        statement: prop?.description ?? "",
        citation: selection,
      }),
    [prop?.description, selection]
  );

  const statementNodes = useMemo(() => {
    const text = prop?.description;
    if (!text) return null;
    if (!selection) return text;

    return (
      <>
        {text.slice(0, selection.start)}
          {text.slice(selection.start, selection.end)}
        </mark>
        {text.slice(selection.end)}
      </>
    );
  }, [prop?.description, selection]);

  const captureSelection = () => {
    const element = statementRef.current;
    if (!element) return;
    const offsets = selectionOffsetsWithin({ element });
    if (!offsets) {
      setSelection(undefined);
      return;
    }
    // Highlight-to-object: selecting a span starts an Against objection.
    setSelection(offsets);
    setVotingOption(votingOptionMap.reject);
  };

  return (
    <div className="grid gap-6">
      {prop?.description && (
        <div
          data-vaul-no-drag
        >
          <p
            ref={statementRef}
            className="select-text"
            onPointerUp={captureSelection}
            onKeyUp={captureSelection}
            tabIndex={0}
          >
            {statementNodes}
          </p>
        </div>
      )}
      <div className="grid gap-2">
        <div className="text-sm font-bold">
          {!userVote ? "Vote" : "Recast Vote"}
        </div>

        <div className="flex gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            value={votingOption}
            onValueChange={(value) => setVotingOption(parseVotingOption(value))}
          >
            <ToggleGroupItem
              value={votingOptionMap.accept}
              aria-label="Toggle accept"
            >
              <span>Accept</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={votingOptionMap.reject}
              aria-label="Toggle reject"
            >
              <span>Reject</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={votingOptionMap.abstain}
              aria-label="Toggle abstain"
            >
              <span>Abstain</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {votingOption === votingOptionMap.reject && (
        <div className="grid gap-2 text-sm">
          <div className="flex gap-x-4 gap-y-2 flex-wrap">
            <div>
              <span className="font-bold">Citation:</span>{" "}
              {selectedText || (
              )}
            </div>
            {selectedText && (
              <div className="shrink-0">
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() => {
                    setSelection(undefined);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
          {!selectedText && (
            <p className="italic flex gap-1 items-center">
              citation
            </p>
          )}
        </div>
      )}

        <>
          <div className="grid gap-2">
            <div className="text-sm">
              <span className="font-bold">Explanation:</span>
            </div>
            <Textarea
              placeholder={
                votingOption === votingOptionMap.reject
                  ? "Explain what would like to be changed"
                  : "Comment on Vote"
              }
              value={votingComment}
              onChange={(e) => setVotingComment(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Button
              size="sm"
              variant="primary"
              type="button"
              className="gap-2 px-2 py-1"
              onClick={handleSubmitVote}
            >
              <span className="text-sm">Cast Vote</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PropVoting;
