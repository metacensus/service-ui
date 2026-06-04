import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import { useFetchData } from "@/hooks/useFetchData";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { Prop } from "../../../types/Prop";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

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


const PropVoting = ({
  topicId,
  propId,
  handleClose,
  userVote,
}: PropVotingProps) => {
  const { toast } = useToast();

  const [votingComment, setVotingComment] = useState("");

  const { data: propsData } = useFetchData<undefined, Prop[]>(
    `${routes.api.topic}/${topicId}/prop`,
    [`statements-${topicId}`],
    "GET"
  );

  const prop =

  const handleSubmitVote = async () => {
    if (!propId || !votingOption || !topicId) {
      return;
    }

    const body: {
      position: string;
      explanation: string;
    } = {
      position: votingOption,
      explanation: votingComment,
    };

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


    const text = prop?.description;
  }, [prop?.description, selection]);

      setSelection(undefined);

  return (
    <div className="grid gap-6">
      {prop?.description && (
          <p
            className="select-text"
          >
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
          >
            <ToggleGroupItem
              value={votingOptionMap.accept}
            >
              <span>Accept</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={votingOptionMap.reject}
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
