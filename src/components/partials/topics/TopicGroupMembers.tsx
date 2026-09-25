import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Topic } from "../../../../types/Topic";

const HYPOTHETICAL = /\s*\(hypothetical\)\s*$/i;

export type GroupMember = {
  id: number;
  name: string;
  role: string;
  hypothetical: boolean;
};

/** The topic's contributors as group members. Seeded stand-ins carry a
 *  "(hypothetical)" suffix in their name; it becomes a flag so the chip can
 *  mark it without repeating it inline. */
export function groupMembers(topic: Pick<Topic, "topicContributors"> | null): GroupMember[] {
  return (topic?.topicContributors ?? []).map(({ contributor }) => ({
    id: contributor.id,
    name: contributor.name.replace(HYPOTHETICAL, ""),
    role: contributor.role,
    hypothetical: HYPOTHETICAL.test(contributor.name),
  }));
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .map((part) => part[0]!.toUpperCase())
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join("");

const TopicGroupMembers = ({ topic }: { topic: Topic | null }) => {
  const members = groupMembers(topic);
  const anyHypothetical = members.some((m) => m.hypothetical);

  return (
    <Card className="mt-4 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle className="text-xl">Group members</CardTitle>
        {members.length > 0 && (
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        )}
      </div>
      <CardContent className="mt-4 p-0">
        {members.length === 0 ? (
        ) : (
          <>
            <ul className="flex flex-wrap gap-3">
              {members.map((member) => (
                <li
                  key={member.id}
                >
                  <span
                    aria-hidden
                  >
                    {initials(member.name)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    {member.hypothetical && (
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {anyHypothetical && (
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicGroupMembers;
