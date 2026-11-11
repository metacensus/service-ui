import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SchemaDiagram } from "./SchemaDiagram";
import type { SchemaExplorerModel } from "../../model/schemaView";

const RUN = "run-fixture";

function renderDiagram(runId: string | null): string {
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <SchemaDiagram model={{} as SchemaExplorerModel} runId={runId} />
    </QueryClientProvider>
  );
}

describe("SchemaDiagram server render", () => {
  it("initially has exactly 5 group buttons, no label or field buttons, and the local-only note is not on the page", () => {
    const html = renderDiagram(RUN);
    const groups = html.match(/data-group="/g) ?? [];
    expect(groups).toHaveLength(5);
    expect(html).not.toContain("data-label=");
    expect(html).not.toContain("data-field=");
    expect(html).not.toContain(
      "Flags and concern notes stay in this browser and do not change the schema or review state."
    );
  });

  it("renders nothing without a run", () => {
    expect(renderDiagram(null)).toBe("");
  });
});
