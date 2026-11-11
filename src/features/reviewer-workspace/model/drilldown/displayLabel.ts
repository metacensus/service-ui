import type { RunLabels } from "@/features/reviewer-workspace/types";
import { demoLabel } from "./demoLabels";

/**
 * DPYD HGVS IDs read as the literature writes them; stored IDs use the run's
 * authored labels. The stored value stays in the tooltip.
 */
export function prettyValue(labels: RunLabels, text: string, field?: string, stored?: unknown): string {
  if (field) {
    const values = Array.isArray(stored) ? stored : [stored ?? text];
    const shown = values.map((value) => demoLabel(labels, field, String(value)));
    if (values.length > 0 && shown.every(Boolean)) return shown.join(", ");
  }
  const dpyd = /^dpyd c(\S+)$/i.exec(text.replace(/_/g, " "));
  if (dpyd) return `DPYD c.${dpyd[1].toUpperCase()}`;
  return text;
}
