import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useSelf = () =>
  useQuery({
    queryKey: ["user-self"],
    queryFn: () => apiClient.getSelf({}),
    refetchInterval: 20000,
  });

export const useGetUserId = () => ({ userId: useSelf().data?.id });
