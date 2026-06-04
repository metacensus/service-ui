import { Button } from "../ui/button";
import { Input } from "../ui/input";

const SearchTopicInput = () => {
  return (
    <div className="flex h-12">
      <Input placeholder="What are you looking for?" className="h-full" />
      <Button variant="primary" className="ml-2 h-full">
        <span>Search</span>
      </Button>
    </div>
  );
};

export default SearchTopicInput;
