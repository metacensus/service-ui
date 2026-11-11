import type { ReviewSeed } from "../model/rowStatus";

export function reviewSeedUrl(runId: string): string {
  return `/metacensus/demo/review-seed/${encodeURIComponent(runId)}.json`;
}

function isReviewSeed(value: unknown, runId: string): value is ReviewSeed {
  const seed = value as Partial<ReviewSeed> | null;
  return (
    typeof seed === "object" &&
    seed !== null &&
    seed.runId === runId &&
    typeof seed.reviewer === "string" &&
    seed.action === "approve" &&
    typeof seed.reviewedAt === "string" &&
    Array.isArray(seed.paperIds) &&
    seed.paperIds.every((id) => typeof id === "string")
  );
}

/** The run's review seed from the demo, or null when the demo has none for it. */
export async function fetchReviewSeed(
  runId: string,
  fetchFn: typeof fetch = fetch
): Promise<ReviewSeed | null> {
  const url = reviewSeedUrl(runId);
  const response = await fetchFn(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Review seed ${url}: ${response.status} ${response.statusText}`);
  const body: unknown = await response.json();
  if (!isReviewSeed(body, runId)) throw new Error(`Review seed ${url} is not a review seed for ${runId}`);
  return body;
}

/** No retries: an unreachable demo settles to "no seed" at once instead of holding the loading gates. */
export const reviewSeedQuery = (runId: string) => ({
  queryKey: ["reviewer-workspace", runId, "review-seed"] as const,
  queryFn: () => fetchReviewSeed(runId),
  staleTime: Infinity,
  retry: false,
});
