"use client";

import queryClient from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
