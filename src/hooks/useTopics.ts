import { apiClient } from "@/lib/apiClient";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Member } from "@metacensus/api";
import type { Topic } from "../../types/Topic";

export const topicsQuery = queryOptions({
  queryKey: ["topics"],
  queryFn: (): Promise<Topic[]> => apiClient.listTopics({}),
});

export const useTopics = () => useQuery(topicsQuery);

export const useTopic = (topicId: string) =>
  useQuery({
    queryKey: [`topic-details-${topicId}`],
    queryFn: (): Promise<Topic> => apiClient.getTopic({ topicId }),
  });

export type NamedMember = Member & { name: string };

export const membersQuery = (topicId: string) =>
  queryOptions({
    queryKey: ["members", topicId],
    queryFn: async (): Promise<NamedMember[]> => {
      const members = await apiClient.listMembers({ topicId });
      return Promise.all(
        members.map(async (member) => ({
          ...member,
          name: (await apiClient.getUser({ userId: member.id })).name,
        }))
      );
    },
  });

export const useMembers = (topicId: string) =>
  useQuery(membersQuery(topicId));
