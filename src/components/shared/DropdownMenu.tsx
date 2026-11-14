"use client";

import { cn } from "@/lib/utils";
import { styles } from "@/styles";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, Search } from "lucide-react";

type DropdownMenuProps = {
  options: { id: number | string; name: string }[];
  onSelect: (name: string, value: { id: number; name: string }) => void;
  includeSearch?: boolean;
  name: string; // Field name to be passed to onSelect
  selectedItems: { id: number | string; name: string }[]; // Array of selected items
  setValue?: (name: string, value: any[]) => void;
  query?: string;
  setQuery?: (query: string) => void;
};

export default function DropdownMenu({
  options,
  onSelect,
  includeSearch = false,
  name,
  selectedItems,
  setValue,
  query = "",
  setQuery,
}: DropdownMenuProps) {
  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.name.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="border border-mc-line-input bg-card shadow-lg rounded-lg w-full">
      <Combobox
        onChange={(value: { id: number; name: string } | null) => {
          if (
            value?.name &&
            !selectedItems?.map((item) => item?.id)?.includes(value?.id || "")
          ) {
            onSelect(name, value);
          } else {
            //filter out the selected item
            setValue &&
              value?.id &&
              setValue(
                name,
                selectedItems.filter((i: any) => i.id !== value.id)
              );
          }
        }}
      >
        {includeSearch && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            <ComboboxInput
              autoFocus
              value={query}
              className={cn(
                "h-12 w-full border-0 bg-transparent pl-11 pr-4 focus-visible:-outline-offset-2 sm:text-sm",
                styles.focusRing
              )}
              placeholder="Search..."
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setQuery && setQuery(event.target.value)
              }
            />
          </div>
        )}

        <ComboboxOptions
          static
          className="max-h-72 scroll-py-2 overflow-y-auto text-sm"
        >
          {filteredOptions.map((option, index) => (
            <ComboboxOption
              key={option.id}
              value={option}
              className={cn(
                "cursor-pointer select-none px-4 py-2 data-[focus]:bg-secondary border-b",
                selectedItems?.map((item) => item?.id)?.includes(option.id) &&
                  "bg-mc-fill-emphasis",
                index === options.length - 1 && "rounded-b-lg border-none",
                !includeSearch && index === 0 && "rounded-t-lg",
                includeSearch && index === 0 && "border-t"
              )}
            >
              <span className="flex gap-2">
                {selectedItems
                  ?.map((item) => item?.id)
                  ?.includes(option.id) && (
                  <Check className="w-5 h-5" />
                )}{" "}
                {option.name}
              </span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
