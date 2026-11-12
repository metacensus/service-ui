import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useUsers = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.listUsers({}),
  });
