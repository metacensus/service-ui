import useOnClickOutside from "@/hooks/useOnClickOutside";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useRef, useState } from "react";
import DropdownMenu from "./DropdownMenu";

type SingleSelectProps = {
  options: { id: number; name: string }[];
  onSelect: (name: string, value: { id: number; name: string }) => void;
  includeSearch?: boolean;
  name: string; // Field name to be passed to onSelect
  selectedItem: { id: string | number; name: string };
  setOpen: (value: boolean) => void;
  open: boolean;
  placeholder?: string;
  label: string;
};

const SingleSelectMenu = ({
  options,
  onSelect,
  includeSearch = false,
  name,
  selectedItem,
  setOpen,
  open,
  placeholder,
  label,
}: SingleSelectProps) => {
  const ref = useRef(null);
  const id = useId();
  const Chevron = open ? ChevronUp : ChevronDown;
  const [query, setQuery] = useState("");

  const selectedId = selectedItem?.id || null;

  useOnClickOutside(ref, () => {
    if (ref.current) {
      setOpen(false);
    }
  });

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <button
        type="button"
        id={id}
        aria-expanded={open}
        className={cn(
          "w-full min-h-10 h-fit py-2 border border-mc-line-input bg-card rounded-md flex items-center mb-1 text-left",
          styles.focusRing
        )}
        onClick={() => setOpen(!open)}
      >
        <span
          className={cn(
            "pl-2 text-sm",
            selectedId ? "font-medium" : "text-muted-foreground"
          )}
        >
          {options.find((option) => option.id === Number(selectedId))?.name ||
            placeholder}
        </span>
        <Chevron className="ml-auto mr-4 w-5 h-5 text-muted-foreground" />
      </button>
      {open && (
        <DropdownMenu
          name={name}
          options={options}
          onSelect={onSelect}
          includeSearch={includeSearch}
          selectedItems={[selectedItem]}
          setQuery={setQuery}
          query={query}
        />
      )}
    </div>
  );
};

export default SingleSelectMenu;
