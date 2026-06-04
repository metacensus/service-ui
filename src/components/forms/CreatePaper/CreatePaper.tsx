// CreatePaper.tsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
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
  const { toast } = useToast();

        headers: Object.fromEntries(headers),
      });

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
            type="text"
            value={state.pmid}
              dispatch({
                type: "SET_FIELD",
                field: "pmid",
                value: e.target.value,
          />
          <Button
            type="button"
            variant="secondary"

        {state.file ? (
          // When a file is selected, display the file name and a 'Remove' button
          // When a file is selected, display the file name and a 'Remove' button
            <div className="flex items-center">
            </div>
            <Button
              onClick={() => dispatch({ type: "REMOVE_FILE" })}
            >
              Remove
            </Button>
          </div>
        ) : (
          // When no file is selected, display the upload prompts
          <div
            {...getRootProps()}
          >
            <div className="text-center ">
                <button
                  type="button"
                  onClick={open}
                >
                  Upload a file
                </button>
                <p className="pl-1">or drag and drop</p>
              </div>
              <div className="pt-2">
                  <div className="flex gap-2 items-center">
                    <UploadIcon className="w-6 h-6 pr-2" />
                    <span>Upload</span>
                  </div>
                </Button>
              </div>
              {errorMessage && (
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Input
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

      <div className="mt-4">
        <Input
          type="url"
          value={state.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: "SET_FIELD", field: "url", value: e.target.value })
          }
        />
      </div>

      <div className="mt-4">
        <Input
          type="text"
          value={state.doi}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: "SET_FIELD", field: "doi", value: e.target.value })
          }
        />
      </div>

      <div className="mt-4">
        {state.authors.map((author, index) => (
          <div key={index} className="flex items-center mt-2">
            <Input
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

      <div className="mt-4">
        <Input
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

      <div className="mt-4">
        <Textarea
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
        <Textarea
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
