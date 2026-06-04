import { ProtocolSection } from "./ProtocolSection";

export type Protocol = {
  id: number;
  title: string;
  protocolSections: ProtocolSection[];
};
