import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { NamedMember } from "@/hooks/useTopics";

const HYPOTHETICAL = /\s*\(hypothetical\)\s*$/i;

export type GroupMember = {
  id: string;
  name: string;
  hypothetical: boolean;
};

/** Seeded stand-ins carry a "(hypothetical)" suffix in their name; it becomes
 *  a flag so the chip can mark it without repeating it inline. */
export function groupMembers(members: Pick<NamedMember, "id" | "name">[]): GroupMember[] {
  return members.map(({ id, name }) => ({
    id,
    name: name.replace(HYPOTHETICAL, ""),
    hypothetical: HYPOTHETICAL.test(name),
  }));
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .map((part) => part[0]!.toUpperCase())
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join("");

const TopicGroupMembers = (props: { members: NamedMember[] }) => {
  const members = groupMembers(props.members);
  const anyHypothetical = members.some((m) => m.hypothetical);

  return (
    <Card className="mt-4 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle className="text-xl">Group members</CardTitle>
        {members.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        )}
      </div>
      <CardContent className="mt-4 p-0">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one has joined this topic yet.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-mc-tint-purple-fill text-[11px] font-bold text-mc-tint-purple-ink"
                  >
                    {initials(member.name)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm">{member.name}</span>
                    {member.hypothetical && (
                      <span className="text-[10px] italic text-muted-foreground">hypothetical</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {anyHypothetical && (
              <p className="mt-4 text-xs text-muted-foreground">
                Members marked hypothetical are demo stand-ins. They are not real
                accounts, and no vote or view is attributed to a real person.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicGroupMembers;
