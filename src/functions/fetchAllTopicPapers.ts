import { fetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import type { Paper } from "../../types/Paper";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** Every paper in the topic, through the paged list endpoint, each once. */
export async function fetchAllTopicPapers(
  topicId: string,
  fetchPage: (body: { topicId: string; page: number; limit: number }) => Promise<Paper[]> = (body) =>
    fetchData(routes.api.paper, "POST", body)
): Promise<Paper[]> {
  const byId = new Map<number, Paper>();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await fetchPage({ topicId, page, limit: PAGE_SIZE });
    for (const paper of batch) if (!byId.has(paper.id)) byId.set(paper.id, paper);
    if (batch.length < PAGE_SIZE) break;
  }
  return [...byId.values()];
}
