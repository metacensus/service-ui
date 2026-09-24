
const INDEX_ERROR = "Could not load the paper index for this run.";

const base = (configured: string | undefined, fallback: string) => configured?.replace(/\/+$/, "") || fallback;
export const schemaIndexUrl = (runId: string) =>

export async function fetchSchemaIndex(runId: string, fetchFn: typeof fetch = fetch): Promise<SchemaIndex> {
  const response = await fetchFn(schemaIndexUrl(runId));
  if (!response.ok) throw new Error(`${INDEX_ERROR} (${response.status})`);
  const body = (await response.json().catch(() => null)) as Partial<SchemaIndex> | null;
  if (body?.run_id !== runId || !Array.isArray(body.papers)) throw new Error(INDEX_ERROR);
  return body as SchemaIndex;
}
