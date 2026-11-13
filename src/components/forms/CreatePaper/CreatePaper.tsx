// CreatePaper.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { FieldError } from "@metacensus/library-ui";
import axios from "axios";
import { UploadIcon } from "lucide-react";
import React, { useCallback, useReducer, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";

type CreatePaperProps = {
  topicId: string;
  setDrawerOpen: (open: boolean) => void;
};

// Define the shape of the component state
interface State {
  file: File | null;
  title: string;
  url: string;
  doi: string;
  pmid: string;
  authors: string[];
  publishedDate: string;
  description: string;
  abstract: string;
}

// Define action types
type Action =
  | {
      type: "SET_FIELD";
      field: keyof Omit<State, "file" | "authors">;
      value: string;
    }
  | { type: "SET_FILE"; file: File }
  | { type: "REMOVE_FILE" }
  | { type: "ADD_AUTHOR" }
  | { type: "REMOVE_AUTHOR"; index: number }
  | { type: "SET_AUTHOR"; index: number; value: string }
  | { type: "PREFILL"; values: Partial<Omit<State, "file">> }
  | { type: "RESET" };

const initialState: State = {
  file: null,
  title: "",
  url: "",
  doi: "",
  pmid: "",
  authors: [""],
  publishedDate: "",
  description: "",
  abstract: "",
};

// Reducer function with type annotations
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_FILE":
      return { ...state, file: action.file };
    case "REMOVE_FILE":
      return { ...state, file: null };
    case "ADD_AUTHOR":
      return { ...state, authors: [...state.authors, ""] };
    case "REMOVE_AUTHOR":
      return {
        ...state,
        authors: state.authors.filter((_, index) => index !== action.index),
      };
    case "PREFILL":
      return { ...state, ...action.values };
    case "SET_AUTHOR":
      const updatedAuthors = [...state.authors];
      updatedAuthors[action.index] = action.value;
      return { ...state, authors: updatedAuthors };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const CreatePaper: React.FC<CreatePaperProps> = ({
  topicId,
  setDrawerOpen,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [pmidLookupLoading, setPmidLookupLoading] = useState<boolean>(false);
  const [pmidLookupError, setPmidLookupError] = useState<string>("");
  const { toast } = useToast();

  // Fetch article metadata from PubMed for the entered PMID and pre-fill the
  // form. Only overwrites fields PubMed actually returns so anything the user
  // already typed is preserved when PubMed has no value for it.
  const handlePmidLookup = async () => {
    const pmid = state.pmid.trim();
    if (!pmid) {
      setPmidLookupError("Enter a PMID first.");
      return;
    }

    setPmidLookupError("");
    setPmidLookupLoading(true);

    try {
      const headers = getAuthHeaders();
      const { data } = await axios.get(routes.api.paperLookup, {
        params: { pmid },
        headers: Object.fromEntries(headers),
      });

      const values: Partial<Omit<State, "file">> = {};
      if (data.title) values.title = data.title;
      if (data.doi) values.doi = data.doi;
      if (data.abstract) values.abstract = data.abstract;
      if (data.publishedDate) values.publishedDate = data.publishedDate;
      if (data.url) values.url = data.url;
      if (Array.isArray(data.authors) && data.authors.length > 0) {
        values.authors = data.authors;
      }

      dispatch({ type: "PREFILL", values });

      toast({ title: "Fields filled from PubMed" });
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Could not look up that PMID.";
      setPmidLookupError(message);
    } finally {
      setPmidLookupLoading(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        dispatch({ type: "SET_FILE", file: acceptedFiles[0] });
        setErrorMessage("");
      }

      if (fileRejections && fileRejections.length > 0) {
        // Handle rejected files
        setErrorMessage("Only PDF files are accepted.");
      }
    },
    []
  );

  // Set 'noClick' to true to prevent the default click behavior
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    noClick: true, // Prevents the default click behavior
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.file) {
      alert("Please upload a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("topicId", `${topicId}`);
    formData.append("title", state.title);
    formData.append("url", state.url);
    formData.append("doi", state.doi);
    formData.append("pmid", state.pmid);
    formData.append("publishedDate", state.publishedDate);
    formData.append("description", state.description);
    formData.append("abstract", state.abstract);
    formData.append(
      "authors",
      JSON.stringify(state.authors.filter((author) => author.trim() !== ""))
    );

    try {
      await axios.post(routes.api.paperCreate, formData);

      await queryClient.invalidateQueries({
        queryKey: [`topics-papers-${topicId}`],
      });

      toast({
        title: "Paper submitted successfully",
      });

      setDrawerOpen(false); // Close the drawer after successful upload
      dispatch({ type: "RESET" }); // Reset the form
    } catch (error) {
      // Handle error
      console.error("Error uploading file:", error);
      // Optionally set an error message to display to the user
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* PMID */}
      <div>
        <Label htmlFor="paper-pmid">PMID</Label>
        <div className="flex items-center gap-2">
          <Input
            id="paper-pmid"
            type="text"
            value={state.pmid}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPmidLookupError("");
              dispatch({
                type: "SET_FIELD",
                field: "pmid",
                value: e.target.value,
              });
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                // Prevent the keypress from submitting the form; look up instead.
                e.preventDefault();
                if (!pmidLookupLoading && state.pmid.trim() !== "") {
                  handlePmidLookup();
                }
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handlePmidLookup}
            disabled={pmidLookupLoading || state.pmid.trim() === ""}
          >
            {pmidLookupLoading ? "Looking up…" : "Look up"}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter a PMID and click Look up to auto-fill from PubMed.
        </p>
        {pmidLookupError && (
          <FieldError className="mt-1">{pmidLookupError}</FieldError>
        )}
      </div>

      {/* File Upload Section */}
      <div className="col-span-full mt-4">
        <Label htmlFor="upload-paper">Upload Paper</Label>

        {state.file ? (
          // When a file is selected, display the file name and a 'Remove' button
          // When a file is selected, display the file name and a 'Remove' button
          <div className="mt-2 flex justify-between items-center rounded-lg border border-mc-line-input px-6 py-4">
            <div className="flex items-center">
              <UploadIcon className="w-6 h-6 text-foreground mr-2" />
              <p className="text-sm text-foreground">{state.file.name}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "REMOVE_FILE" })}
            >
              Remove
            </Button>
          </div>
        ) : (
          // When no file is selected, display the upload prompts
          <div
            {...getRootProps()}
            className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-mc-line-input px-6 py-10 cursor-pointer"
          >
            <input {...getInputProps()} id="upload-paper" className="sr-only" />
            <div className="text-center ">
              <div className="mt-4 flex text-sm leading-6 text-foreground">
                <button
                  type="button"
                  onClick={open}
                  className={cn(
                    styles.focusRing,
                    "relative cursor-pointer rounded-md font-semibold text-mc-ink-accent hover:underline"
                  )}
                >
                  Upload a file
                </button>
                <p className="pl-1">or drag and drop</p>
              </div>
              <div className="pt-2">
                <Button variant="secondary" type="button" onClick={open}>
                  <div className="flex gap-2 items-center">
                    <UploadIcon className="w-6 h-6 pr-2" />
                    <span>Upload</span>
                  </div>
                </Button>
              </div>
              {/* Display error message if any */}
              {errorMessage && (
                <FieldError className="mt-2">{errorMessage}</FieldError>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Paper Title */}
      <div className="mt-4">
        <Label htmlFor="paper-title">Paper Title</Label>
        <Input
          id="paper-title"
          type="text"
          value={state.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({
              type: "SET_FIELD",
              field: "title",
              value: e.target.value,
            })
          }
          required
        />
      </div>

      {/* Paper URL */}
      <div className="mt-4">
        <Label htmlFor="paper-url">Paper URL</Label>
        <Input
          id="paper-url"
          type="url"
          value={state.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: "SET_FIELD", field: "url", value: e.target.value })
          }
        />
      </div>

      {/* DOI */}
      <div className="mt-4">
        <Label htmlFor="paper-doi">DOI</Label>
        <Input
          id="paper-doi"
          type="text"
          value={state.doi}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: "SET_FIELD", field: "doi", value: e.target.value })
          }
        />
      </div>

      {/* Authors */}
      <div className="mt-4">
        <Label htmlFor="author-0">Authors</Label>
        {state.authors.map((author, index) => (
          <div key={index} className="flex items-center mt-2">
            <Input
              id={`author-${index}`}
              type="text"
              value={author}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                dispatch({ type: "SET_AUTHOR", index, value: e.target.value })
              }
              placeholder={`Author ${index + 1}`}
              required
            />
            <Button
              type="button"
              variant="secondary"
              className="ml-2"
              onClick={() => dispatch({ type: "REMOVE_AUTHOR", index })}
              disabled={state.authors.length === 1}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => dispatch({ type: "ADD_AUTHOR" })}
        >
          Add Author
        </Button>
      </div>

      {/* Published Date */}
      <div className="mt-4">
        <Label htmlFor="paper-published-date">Published Date</Label>
        <Input
          id="paper-published-date"
          type="date"
          value={state.publishedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({
              type: "SET_FIELD",
              field: "publishedDate",
              value: e.target.value,
            })
          }
        />
      </div>

      {/* Description */}
      <div className="mt-4">
        <Label htmlFor="paper-description">Description</Label>
        <Textarea
          id="paper-description"
          value={state.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            dispatch({
              type: "SET_FIELD",
              field: "description",
              value: e.target.value,
            })
          }
        />
      </div>

      <div className="mt-4">
        <Label htmlFor="paper-abstract">Abstract</Label>
        <Textarea
          id="paper-abstract"
          value={state.abstract}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            dispatch({
              type: "SET_FIELD",
              field: "abstract",
              value: e.target.value,
            })
          }
        />
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </div>
    </form>
  );
};

export default CreatePaper;
