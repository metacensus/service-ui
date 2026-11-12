import { apiClient } from "@/lib/apiClient";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Prop } from "../../types/Prop";

export const propsQuery = (topicId: string) =>
  queryOptions({
    queryKey: ["props", topicId],
    queryFn: (): Promise<Prop[]> => apiClient.listProps({ topicId }),
  });

export const useProps = (topicId: string) => useQuery(propsQuery(topicId));

export const useVotes = (topicId: string, propId: string | undefined) =>
  useQuery({
    queryKey: ["votes", topicId, propId],
    queryFn: () => apiClient.listVotes({ topicId, propId: propId! }),
    enabled: !!propId,
  });
