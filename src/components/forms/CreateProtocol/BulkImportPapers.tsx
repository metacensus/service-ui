"use client";

import TextBubble from "@/components/shared/TextBubble";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { format } from "date-fns";
import { Dispatch, FC, SetStateAction, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PubMedSearchSummary } from "../../../../types/PubMed";

const fieldNames = [
  { name: "Affiliation", fieldQueryName: "Affiliation", type: "string" },
  { name: "All Fields", fieldQueryName: "", type: "string" },
  { name: "Author", fieldQueryName: "Author", type: "string" },
  {
    name: "Author - Corporate",
    fieldQueryName: "Author - Corporate",
    type: "string",
  },
  { name: "Author - First", fieldQueryName: "Author - First", type: "string" },
  {
    name: "Author - Identifier",
    fieldQueryName: "Author - Identifier",
    type: "string",
  },
  { name: "Author - Last", fieldQueryName: "Author - Last", type: "string" },
  { name: "Book", fieldQueryName: "Book", type: "string" },
  {
    name: "Conflict of Interest Statements",
    fieldQueryName: "Conflict of Interest Statements",
    type: "string",
  },
  {
    name: "Date - Completion",
    fieldQueryName: "Date - Completion",
    type: "date-range",
  },
  {
    name: "Date - Create",
    fieldQueryName: "Date - Create",
    type: "date-range",
  },
  { name: "Date - Entry", fieldQueryName: "Date - Entry", type: "date-range" },
  { name: "Date - MeSH", fieldQueryName: "Date - MeSH", type: "date-range" },
  {
    name: "Date - Modification",
    fieldQueryName: "Date - Modification",
    type: "date-range",
  },
  {
    name: "Date - Publication",
    fieldQueryName: "Date - Publication",
    type: "date-range",
  },
  { name: "EC/RN Number", fieldQueryName: "EC/RN Number", type: "string" },
  { name: "Editor", fieldQueryName: "Editor", type: "string" },
  { name: "Filter", fieldQueryName: "Filter", type: "string" },
  {
    name: "Grants and Funding",
    fieldQueryName: "Grants and Funding",
    type: "string",
  },
  { name: "ISBN", fieldQueryName: "ISBN", type: "string" },
  { name: "Investigator", fieldQueryName: "Investigator", type: "string" },
  { name: "Issue", fieldQueryName: "Issue", type: "string" },
  { name: "Journal", fieldQueryName: "Journal", type: "string" },
  { name: "Language", fieldQueryName: "Language", type: "string" },
  { name: "Location ID", fieldQueryName: "Location ID", type: "string" },
  {
    name: "MeSH Major Topic",
    fieldQueryName: "MeSH Major Topic",
    type: "string",
  },
  {
    name: "MeSH Subheading",
    fieldQueryName: "MeSH Subheading",
    type: "string",
  },
  { name: "MeSH Terms", fieldQueryName: "MeSH Terms", type: "string" },
  { name: "Other Term", fieldQueryName: "Other Term", type: "string" },
  { name: "Pagination", fieldQueryName: "Pagination", type: "string" },
  {
    name: "Pharmacological Action",
    fieldQueryName: "Pharmacological Action",
    type: "string",
  },
  {
    name: "Publication Type",
    fieldQueryName: "Publication Type",
    type: "string",
  },
  { name: "Publisher", fieldQueryName: "Publisher", type: "string" },
  {
    name: "Secondary Source ID",
    fieldQueryName: "Secondary Source ID",
    type: "string",
  },
  {
    name: "Subject - Personal Name",
    fieldQueryName: "Subject - Personal Name",
    type: "string",
  },
  {
    name: "Supplementary Concept",
    fieldQueryName: "Supplementary Concept",
    type: "string",
  },
  { name: "Text Word", fieldQueryName: "Text Word", type: "string" },
  { name: "Title", fieldQueryName: "Title", type: "string" },
  { name: "Title/Abstract", fieldQueryName: "Title/Abstract", type: "string" },
  {
    name: "Transliterated Title",
    fieldQueryName: "Transliterated Title",
    type: "string",
  },
  { name: "Volume", fieldQueryName: "Volume", type: "string" },
];

const FormData = z.object({
  searchTerm: z.string().min(3),
});

type FormDataSchema = z.infer<typeof FormData>;

type BulkImportPapersProps = {
  onSuccess?: () => void;
  topicId: string;
};

const DB_TO_SEARCH = "pubmed";

export const BulkImportPapers: FC<BulkImportPapersProps> = ({
  onSuccess,
  topicId,
}) => {
  const [querySearchTerm, setQuerySearchTerm] = useState("");
  const [fieldType, setFieldType] = useState("All Fields");
  const [fieldTerm, setFieldTerm] = useState("");
  const [fieldStart, setFieldStart] = useState<Date | undefined>(undefined);
  const [fieldEnd, setFieldEnd] = useState<Date | undefined>(undefined);
  const [addWith, setAddWith] = useState<"AND" | "OR" | "NOT">("AND");
  const [selectedPaperUids, setSelectedPaperUids] = useState<string[]>([]);

  const { toast } = useToast();

  const queryBody = { db: DB_TO_SEARCH, querySearchTerm };
  const {
    data: paperDetails,
    isFetching,
    status,
  } = useFetchData<
    typeof queryBody,
    {
      result: Record<string, PubMedSearchSummary | string[]>;
      header: Record<string, string>;
    }
  >(routes.api.litSearch, [`lit-search-${querySearchTerm}`], "POST", queryBody, {
    enabled: !!querySearchTerm,
    retryDelay: (retryCount) => retryCount * 3000,
    networkMode: "offlineFirst",
    staleTime: Infinity,
  });

  const papersResult = paperDetails?.result ?? {};
  const papers: PubMedSearchSummary[] = Object.keys(papersResult)
    .map((uid) => {
      if (uid === "uids") return undefined;

      return papersResult[uid] as PubMedSearchSummary;
    })
    .filter((paper): paper is PubMedSearchSummary => paper !== undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormDataSchema>({
    resolver: zodResolver(FormData),
    values: {
      searchTerm: "",
    },
  });

  const getNewStringValue = () => {
    const existingSearchTerm = watch("searchTerm");

    const selectedField =
      fieldNames.find((field) => field.name === fieldType) ?? fieldNames[1];
    const selectedFieldType = selectedField.type;
    const selectedFieldName = selectedField.fieldQueryName
      ? `[${selectedField.fieldQueryName}]`
      : selectedField.fieldQueryName;

    let newTerm: string;

    if (selectedFieldType === "date-range") {
      // start and end?
      const startFormatted = fieldStart
        ? format(fieldStart, "yyyy/MM/dd")
        : "1000";
      const endFormatted = fieldEnd ? format(fieldEnd, "yyyy/MM/dd") : "3000";

      newTerm = `(${startFormatted}${selectedFieldName} : ${endFormatted}${selectedFieldName})`;
    } else {
      newTerm = `(${fieldTerm}${selectedFieldName})`;
    }

    if (!existingSearchTerm) return newTerm;

    if (addWith === "NOT") {
      return `${existingSearchTerm} NOT ${newTerm}`;
    }

    if (addWith === "OR") {
      return `${existingSearchTerm} OR ${newTerm}`;
    }

    return `(${existingSearchTerm} AND ${newTerm})`;
  };

  const updateSearchTerm = () => {
    setValue("searchTerm", getNewStringValue());
    setFieldTerm("");
  };

  const currentlySelectedTermFieldType = useMemo(() => {
    return (
      fieldNames.find((field) => field.name === fieldType) || fieldNames[1]
    ).type;
  }, [fieldType]);

  const addSelectedPapers = async () => {
    await Promise.allSettled(
      selectedPaperUids.map(async (uid) => {
        const paper = papers.find((p) => p.uid === uid);
        if (!paper) return;

        return fetch(routes.api.paperCreate, {
          method: "POST",
          body: JSON.stringify({
            title: paper.title,
            url: paper.availablefromurl,
            description: paper.availablefromurl,
            fullTextUrl: `https://pubmed.ncbi.nlm.nih.gov/${paper.uid}/`,
            authors: paper.authors,
            pmid: paper.uid,
            //
            status: "Pending Review",
            topicId: topicId,
          }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }

          return response.json();
        });
      })
    ).then((results) => {
      if (!results.every((result) => result.status === "fulfilled")) {
        toast({
          title: "Error adding papers",
          description: "Some papers could not be added.",
          variant: "destructive",
        });
        return;
      }

      setSelectedPaperUids([]);

      toast({
        title: "Papers added",
        description: "Selected papers have been added to the topic.",
      });

      onSuccess?.();
    });
  };

  return (
    <div>
      <form
        className="mt-4"
        onSubmit={handleSubmit((data) => {
          setQuerySearchTerm(data.searchTerm);
        })}
      >
        <div className="grid gap-4">
          <div className="flex gap-2">
            <Select
              name="field-type"
              value={fieldType}
              onValueChange={(value) => setFieldType(value)}
            >
                <SelectValue placeholder="Select Field" />
              </SelectTrigger>
              <SelectContent>
                {fieldNames.map((field, index) => (
                  <SelectItem key={index} value={field.name}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentlySelectedTermFieldType === "string" && (
              <Input
                className="flex-2"
                name="field-term"
                placeholder="Enter a search term"
                type="text"
                value={fieldTerm}
                onChange={(event) => setFieldTerm(event.target.value)}
              />
            )}
            {currentlySelectedTermFieldType === "date-range" && (
              <div className="flex gap-2 flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal flex gap-2",
                        !fieldStart && "text-muted-foreground"
                      )}
                    >
                      {fieldStart ? (
                        format(fieldStart, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      className="pb-0"
                      mode="single"
                      selected={fieldStart}
                      onSelect={setFieldStart}
                      initialFocus
                    />
                    <div className="flex justify-end">
                      <Button
                        disabled={!fieldStart}
                        variant="ghost"
                        onClick={() => setFieldStart(undefined)}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal flex gap-2",
                        !fieldEnd && "text-muted-foreground"
                      )}
                    >
                      {fieldEnd ? (
                        format(fieldEnd, "PPP")
                      ) : (
                        <span>Current Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      className="pb-0"
                      mode="single"
                      selected={fieldEnd}
                      onSelect={setFieldEnd}
                      initialFocus
                    />
                    <div className="flex justify-end">
                      <Button
                        disabled={!fieldEnd}
                        variant="ghost"
                        onClick={() => setFieldEnd(undefined)}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center">
              <Button
                className="rounded-r-none"
                onClick={updateSearchTerm}
                type="button"
              >
                {watch("searchTerm") ? addWith : "AND"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={!watch("searchTerm")}
                    type="button"
                  >
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setAddWith("AND")}>
                    Add with AND
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!watch("searchTerm")}
                    onClick={() => setAddWith("OR")}
                  >
                    Add with OR
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!watch("searchTerm")}
                    onClick={() => setAddWith("NOT")}
                  >
                    Add with NOT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="grid gap-1 flex-1">
            </div>
          </div>
          <div>
              <span>Search</span>
            </Button>
          </div>
        </div>
      </form>

      <div className="prose mt-4">
        {isFetching && <p>Loading...</p>}

        {status === "success" && !papers.length && <p>No results found</p>}
      </div>

      <ul className="grid gap-8 mt-8">
        {papers.map((paper, index) => (
          <PaperListItem
            key={index}
            paper={paper}
            selectedPaperUids={selectedPaperUids}
            setSelectedPaperUids={setSelectedPaperUids}
          />
        ))}
      </ul>

      {selectedPaperUids.length > 0 && (
        <div className="fixed bottom-0 w-full p-2">
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={addSelectedPapers}
          >
            Add Selected Papers
          </Button>
        </div>
      )}
    </div>
  );
};

const PaperListItem = ({
  paper,
  selectedPaperUids,
  setSelectedPaperUids,
}: {
  paper: PubMedSearchSummary;
  selectedPaperUids: string[];
  setSelectedPaperUids: Dispatch<SetStateAction<string[]>>;
}) => {
  const authors = Array.isArray(paper.authors) ? paper.authors : [];

  const { data: abstractData } = useFetchData<undefined, string[]>(
    `${routes.api.litSearchAbstract(paper.uid)}?db=${DB_TO_SEARCH}`,
    ["paper-abstract", DB_TO_SEARCH, paper.uid],
    "GET",
    undefined,
    {
      retryDelay: (retryCount) => retryCount * 3000,
      networkMode: "offlineFirst",
      staleTime: Infinity,
    }
  );

  const isCheckboxChecked = selectedPaperUids.includes(paper.uid);

  const togglePaperUid = (paperUid: string) => {
    setSelectedPaperUids((uids) => {
      if (uids.includes(paperUid)) {
        return uids.filter((uid) => uid !== paperUid);
      }

      return [...uids, paperUid];
    });
  };

  return (
    <li className="prose max-w-full flex gap-4 prose-h4:mt-0">
      <div>
          type="checkbox"
          checked={isCheckboxChecked}
          onChange={() => {
            togglePaperUid(paper.uid);
          }}
        />
      </div>
      <div>
        <button
          className="text-left"
          onClick={() => {
            togglePaperUid(paper.uid);
          }}
        >
          <h4>{paper.title}</h4>
        </button>
        <div className="flex gap-2 flex-wrap">
          {authors.map((author, index) => (
            <TextBubble color="gray" key={index} text={author.name} />
          ))}
        </div>
          {paper.fulljournalname}. {paper.epubdate} {paper.essn}.{" "}
          {paper.elocationid}. {paper.pubtype.join(",")} {paper.epubdate}.
          <br />
          PMID: {paper.uid}
        </p>
        {abstractData?.at(0) && <AbstractText abstract={abstractData.at(0)} />}
      </div>
    </li>
  );
};

const AbstractText: FC<{ abstract?: string | null }> = ({ abstract }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="grid lg:flex justify-between items-baseline">
      <p
        className={clsx(
          isExpanded ? "hover:line-clamp-none" : "line-clamp-2"
        )}
      >
        Purpose: {abstract}
      </p>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsExpanded((ie) => !ie)}
      >
        {isExpanded ? "Read Less" : "Read More"}
      </Button>
    </div>
  );
};
