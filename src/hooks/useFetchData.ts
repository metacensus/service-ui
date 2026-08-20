"use client";

import { getAuthHeaders } from "@/functions/getAuthHeaders";
import {
  QueryKey,
  QueryObserverOptions,
  useQuery,
} from "@tanstack/react-query";

type AllowedMethods = "GET" | "POST" | "PUT" | "DELETE";

export const fetchData = async <TBody, UResponse>(
  url: string,
  method?: AllowedMethods,
  body?: TBody
): Promise<UResponse> => {
  const requestInit: RequestInit = {
    method: method || "GET",
    headers,
  };
  if (method !== "GET") requestInit.body = JSON.stringify(body);

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    // Parse inside its own try: throwing the parsed message from within the
    // try block meant the catch swallowed it and every failure — including a
    // 429 rate limit — surfaced as the generic "Request failed".
    let message: string | undefined;
    try {
      const responseJson = await response.json();
      message = responseJson.error || responseJson.message;
    } catch {
      message = undefined;
    }
    throw new Error(message || "Request failed");
  }

  return response.json();
};

export const useFetchData = <TBody, UResponse>(
  url: string,
  queryKey: QueryKey,
  method?: AllowedMethods,
  body?: TBody,
  queryOptions?: Partial<QueryObserverOptions<UResponse>>
) => {
  return useQuery<UResponse, Error>({
    ...queryOptions,
    queryKey: [...queryKey, JSON.stringify(body)],
    queryFn: () => fetchData<TBody, UResponse>(url, method, body),
  });
};
