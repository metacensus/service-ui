export type ProtocolElement = {
  id: number;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  conditionallyShown: boolean;
  options: {
    name: string;
    value: string;
  }[];
  sortOrder: number;
};
