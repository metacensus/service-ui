import { QueryClient } from "@tanstack/react-query";

import { is4xx } from "@/lib/apiClient";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !is4xx(error) && failureCount < 2,
    },
  },
});

export default queryClient;
