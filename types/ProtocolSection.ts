import { ProtocolElement } from "./ProtocolElement";

export type ProtocolSection = {
  title: string;
  id: number;
  sortOrder: number;
  protocolElements: ProtocolElement[];
};
