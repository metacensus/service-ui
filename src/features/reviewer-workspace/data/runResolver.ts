const configuredRunId = import.meta.env.VITE_REVIEWER_RUN_ID?.trim() || null;
const configuredTopicId =
  import.meta.env.VITE_REVIEWER_TOPIC_ID?.trim() || null;
const snapshotBase =
  import.meta.env.VITE_REVIEWER_SNAPSHOT_BASE_URL?.replace(/\/+$/, "") ||
  "/reviewer-snapshots/dpyd";

export function resolveRunId(topicId: string): string | null {
  if (!configuredRunId) return null;
  if (configuredTopicId && topicId !== configuredTopicId) return null;
  return configuredRunId;
}

export function fixtureBasePath(runId: string): string {
  return `${snapshotBase}/${encodeURIComponent(runId)}`;
}
