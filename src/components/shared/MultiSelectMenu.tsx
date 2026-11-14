import useOnClickOutside from "@/hooks/useOnClickOutside";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { useId, useRef, useState } from "react";
import DropdownMenu from "./DropdownMenu";
import TextBubble from "./TextBubble";

type MultiSelectProps = {
  options: { id: string | number; name: string }[];
  onSelect: (name: string, value: { id: number; name: string }) => void;
  includeSearch?: boolean;
  name: string; // Field name to be passed to onSelect
  selectedItems: { id: string | number; name: string }[]; // Array of selected items
  setOpen: (value: boolean) => void;
  open: boolean;
  setValue: (
    name: string,
    value: { id: string | number; name: string }[]
  ) => void;
  placeholder?: string;
  label: string;
};

const MultiSelectMenu = ({
  options,
  onSelect,
  includeSearch = false,
  name,
  selectedItems,
  setOpen,
  open,
  setValue,
  placeholder,
  label,
}: MultiSelectProps) => {
  const ref = useRef(null);
  const id = useId();
  const Chevron = open ? ChevronUp : ChevronDown;
  const [query, setQuery] = useState("");

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
        <span className="w-fit pl-2 flex flex-row gap-2  flex-wrap">
          {!selectedItems.length && (
            <span className="text-muted-foreground text-sm capitalize">
              {placeholder}
            </span>
          )}
          {selectedItems.map((item, index) => (
            <TextBubble
              key={index}
              text={item.name}
              color="gray"
              className="w-fit cursor-default text-nowrap"
              iconEnd={
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue(
                      name,
                      selectedItems.filter((i) => i.id !== item.id)
                    );
                  }}
                />
              }
            />
          ))}
        </span>
        <Chevron className="ml-auto mr-4 w-5 h-5 text-muted-foreground" />
      </button>
      {open && (
        <DropdownMenu
          name={name}
          options={options}
          onSelect={onSelect}
          includeSearch={includeSearch}
          selectedItems={selectedItems}
          setValue={setValue}
          setQuery={setQuery}
          query={query}
        />
      )}
    </div>
  );
};

export default MultiSelectMenu;
