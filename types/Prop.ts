import type { PropRecord } from "@metacensus/api";

/** Fields the contract's Prop lacks; the Client never fills them. metacensus/service-ui#8 drops them. */
export type Prop = PropRecord & {
  authorId?: string;
  concluded?: string;
  conclusion?: "open" | "passed" | "failed" | "expired";
};
