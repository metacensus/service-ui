import { ApiError } from "@metacensus/api";
import { QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import queryClient from "./queryClient";

/** How many times a query whose every attempt fails with `error` is retried. */
const retries = async (error: Error) => {
  const queryFn = vi.fn(() => Promise.reject(error));
  const observer = new QueryObserver(queryClient, {
    queryKey: ["failing"],
    queryFn,
    retryDelay: 0,
  });
  await new Promise<void>((resolve) => {
    const unsubscribe = observer.subscribe((result) => {
      if (result.isError) {
        unsubscribe();
        resolve();
      }
    });
  });
  return queryFn.mock.calls.length - 1;
};

afterEach(() => {
  queryClient.clear();
});

describe("queryClient", () => {
  it.each<[string, number, Error]>([
    ["a 4xx ApiError", 0, new ApiError("GET", "/self", 400, "")],
    ["a 5xx ApiError", 2, new ApiError("GET", "/self", 500, "")],
    ["a timeout", 2, new DOMException("signal timed out", "TimeoutError")],
    ["a network error", 2, new TypeError("Failed to fetch")],
  ])("retries a query failing with %s %i times", async (_, times, error) => {
    expect(await retries(error)).toBe(times);
  });
});
