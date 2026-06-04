import useOnClickOutside from "@/hooks/useOnClickOutside";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [query, setQuery] = useState("");

  const selectedId = selectedItem?.id || null;

  useOnClickOutside(ref, () => {
    if (ref.current) {
      setOpen(false);
    }
  });

  return (
        onClick={() => setOpen(!open)}
      >
        <span
          className={cn(
          )}
        >
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
