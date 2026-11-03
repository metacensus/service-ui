import type { UseQueryResult } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AsyncSection from "./AsyncSection";

const render = (query: Partial<UseQueryResult<string[], Error>>) =>
  renderToStaticMarkup(
    <AsyncSection
      query={query as UseQueryResult<string[], Error>}
      isEmpty={(data) => data.length === 0}
      empty="empty"
      loading="loading"
    >
      {(data) => data.join()}
    </AsyncSection>
  );

describe("AsyncSection", () => {
  it.each([
    ["loading before any attempt fails", { isPending: true, failureCount: 0 }, "loading"],
    ["retrying once an attempt fails", { isPending: true, failureCount: 1 }, "Still trying"],
    ["its error state once retries run out", { isError: true, failureCount: 3 }, "Could not load"],
  ])("renders %s", (_, query, text) => {
    expect(render(query)).toContain(text);
  });
});
