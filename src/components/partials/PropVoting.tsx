import { SignPrompt, signedWriteError } from "@/components/shared/SignedWrite";
import { useToast } from "@/hooks/use-toast";
import { useGetUserId } from "@/hooks/useGetUserId";
import { useProps } from "@/hooks/useProps";
import { apiClient } from "@/lib/apiClient";
import queryClient from "@/lib/queryClient";
import { Prop_Type, Vote_Position, type PropCitation } from "@metacensus/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  excerptForCitation,
  selectionOffsetsWithin,
} from "./statementCitations";
import { Check, Circle, TextCursor, X } from "lucide-react";

type PropVotingProps = {
  topicId: string;
  propId: string;
  handleClose?: () => void;
  userVote?: unknown;
};

const votingOptionMap = {
  accept: Vote_Position.For,
  reject: Vote_Position.Against,
  abstain: Vote_Position.Abstain,
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
  const { userId } = useGetUserId();
  const statementRef = useRef<HTMLParagraphElement>(null);

  const [votingComment, setVotingComment] = useState("");
  const [votingOption, setVotingOption] = useState<VotingOption | "">("");
  const [selection, setSelection] = useState<PropCitation | undefined>(
    undefined
  );

  const { data: propsData } = useProps(topicId);

  const prop =
    propsData
      ?.filter((item) => item.type === Prop_Type.Statement)
      .find((item) => item.id === propId) || null;

  const handleSubmitVote = async () => {
    if (!propId || !votingOption || !topicId || !userId) {
      return;
    }

    try {
      await apiClient.setVote({
        topicId,
        propId,
        content: {
          topicId,
          propId,
          userId,
          position: votingOption,
          explanation: votingComment,
          // Citations are meaningful for Against only (contract).
          citations:
            votingOption === votingOptionMap.reject && selection
              ? [selection]
              : [],
        },
      });
    } catch (error) {
      toast({
        title: "Vote failed",
        description: signedWriteError(error),
        variant: "destructive",
      });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["votes", topicId, propId],
    });
    toast({
      title: "Vote submitted",
      description: "Your vote has been submitted successfully",
    });

    setVotingOption("");
    setVotingComment("");
    setSelection(undefined);
    handleClose && handleClose();
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
        <mark className="bg-mc-fill-emphasis text-inherit rounded-sm px-0.5">
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
          className="border rounded-md border-dashed border-mc-ink-secondary px-6 py-4"
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
              <Check className="h-4 w-4" />
              <span>Accept</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={votingOptionMap.reject}
              aria-label="Toggle reject"
            >
              <X className="h-4 w-4" />
              <span>Reject</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={votingOptionMap.abstain}
              aria-label="Toggle abstain"
            >
              <Circle className="h-4 w-4" />
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
                <span className="text-muted-foreground">None provided</span>
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
              <TextCursor className="size-[1em]" /> Select text from the statement above to add a
              citation
            </p>
          )}
        </div>
      )}

      {votingOption && (
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
              disabled={!votingOption || !userId}
            >
              <span className="text-sm">Cast Vote</span>
            </Button>
          </div>
          <SignPrompt action="Casting a vote" />
        </>
      )}
    </div>
  );
};

export default PropVoting;
