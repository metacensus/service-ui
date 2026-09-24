import { createContext } from "react";
import type { WorkingSetControls } from "../../hooks/useWorkingSet";

type MembershipContextValue = {
  workingSet: WorkingSetControls;
  /** Announces a confirmed save in Chat's polite live region; null clears it. */
  onSaved: (message: string | null) => void;
};

/** The working set every membership bubble in Data → Chat reads and saves through. */
export const MembershipContext = createContext<MembershipContextValue | null>(null);
