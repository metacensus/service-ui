"use client";

import { cn } from "@/lib/utils";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

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
              aria-hidden="true"
            />
            <ComboboxInput
              autoFocus
              value={query}
              placeholder="Search..."
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setQuery && setQuery(event.target.value)
              }
            />
          </div>
        )}

        <ComboboxOptions
          static
        >
          {filteredOptions.map((option, index) => (
            <ComboboxOption
              key={option.id}
              value={option}
              className={cn(
                selectedItems?.map((item) => item?.id)?.includes(option.id) &&
                index === options.length - 1 && "rounded-b-lg border-none",
                !includeSearch && index === 0 && "rounded-t-lg",
                includeSearch && index === 0 && "border-t"
              )}
            >
              <span className="flex gap-2">
                {selectedItems
                  ?.map((item) => item?.id)
                  ?.includes(option.id) && (
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
