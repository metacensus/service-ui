import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MembershipEditorPanel, type MembershipEditorPanelProps } from "./MembershipEditor";

const noop = () => {};

function panel(props: Partial<MembershipEditorPanelProps> & Pick<MembershipEditorPanelProps, "reasonRequired">) {
  return renderToStaticMarkup(
    <MembershipEditorPanel
      idBase="paper-1"
      subject="Amstutz 2009 (Pharmacogenomics)"
      currentLine="Current: Excluded by default — no decision recorded — no recorded reason"
      confirmLabel="Add to set"
      reason=""
      onReasonChange={noop}
      error={null}
      pending={false}
      onConfirm={noop}
      onCancel={noop}
      {...props}
    />
  );
}

describe("membership editor panel", () => {
  it("required mode reads the chat's text, in order", () => {
    const html = panel({ reasonRequired: true });
    expect(html).toBe(
      [
        '<div class="mt-2.5 flex gap-2">',
        "</div>",
      ].join("")
    );
  });

  it("optional mode labels the reason optional and confirms with the Table's action", () => {
    const html = panel({
      reasonRequired: false,
      idBase: "table",
      subject: "2 papers",
      currentLine: "Current: 0 of 2 selected papers in the working set",
      confirmLabel: "Add to set",
    });
    expect(html).toContain(">Current: 0 of 2 selected papers in the working set</p>");
    expect(html).toContain('<textarea id="membership-reason-table" aria-label="Reason for changing paper selection (optional)" rows="3"');
    expect(html).toContain(">Add to set</button>");
    expect(html).toContain(">Cancel</button>");
    expect(html).not.toContain("Reason (required)");
  });

  it("shows the error in the alert and the reason in the field", () => {
    const html = panel({
      reasonRequired: false,
      reason: "stale check",
      error: "The working set changed elsewhere. It now shows the latest; try again.",
      confirmLabel: "Remove from set",
    });
    expect(html).toContain(">stale check</textarea>");
    expect(html).toContain(
    );
    expect(html).toContain(">Remove from set</button>");
  });

  it("disables only the confirm button while a save is pending", () => {
    const html = panel({ reasonRequired: true, pending: true });
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
    expect(html).toMatch(/<button type="button" disabled=""[^>]*>Add to set<\/button>/);
  });
});
