import useOnClickOutside from "@/hooks/useOnClickOutside";
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
  const [query, setQuery] = useState("");

  useOnClickOutside(ref, () => {
    if (ref.current) {
      setOpen(false);
    }
  });
  return (
        onClick={() => setOpen(!open)}
      >
          {!selectedItems.length && (
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
