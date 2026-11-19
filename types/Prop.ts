import type { PropRecord } from "@metacensus/api";

/** Fields the contract's Prop lacks; the Client never fills them. They stay until the contract decides them. */
export type Prop = PropRecord & {
  authorId?: string;
  concluded?: string;
  conclusion?: "open" | "passed" | "failed" | "expired";
};
