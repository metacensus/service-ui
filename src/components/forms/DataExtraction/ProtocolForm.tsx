import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { PdfSelection } from "@/lib/pdfSelection";
import { useRouter } from "@/lib/next-navigation-compat";
import React, {
  FormEvent,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  DataExtraction,
  SourceLocation,
} from "../../../../types/DataExtraction";
import { Protocol } from "../../../../types/Protocol";
import DataExtractionField from "./DataExtractionField";

interface ProtocolFormProps {
  protocol: Protocol;
  handleSubmit: (
    data: DataToSave[],
    protocolId: number,
    paperId: number
  ) => void;
  selection: PdfSelection | null;
  resetSelection: () => void;
  topicId: string;
  paperId: number;
  extractionReviewId?: string | null;
  viewOnly?: boolean;
  onShowSource?: (location: SourceLocation | null) => void;
}

type FormState = {
  [key: number]: any;
};

type LocationState = {
  [key: number]: SourceLocation | null;
};

type Action =
  | { type: "UPDATE_FIELD"; payload: { fieldId: number; value: any } }
  | {
      type: "UPDATE_LOCATION";
      payload: { fieldId: number; location: SourceLocation | null };
    };

interface DataToSave {
  protocolElementId: number;
  data: any;
  sourceLocation: SourceLocation | null;
  topicId: string;
  protocolId: number;
  paperId: number;
}

const ProtocolForm: React.FC<ProtocolFormProps> = ({
  protocol,
  handleSubmit,
  selection,
  resetSelection,
  topicId,
  paperId,
  extractionReviewId,
  viewOnly = false,
  onShowSource,
}) => {
  const router = useRouter();

  const sections = protocol?.protocolSections || [];

  const queryBody = { paperId, extractionReviewId };
  const { data: dataExtractionQuery } = useFetchData<
    typeof queryBody,
    DataExtraction[]
  >(routes.api.extraction, [`data-extraction-${paperId}`], "POST", {
    paperId,
    extractionReviewId,
  });

  const dataExtraction = useMemo(() => {
    if (dataExtractionQuery) {
      return dataExtractionQuery;
    }
    return [];
  }, [dataExtractionQuery]);

  const initialFormState: FormState = {};
  const formReducer = (state: FormState, action: Action): FormState => {
    if (action.type === "UPDATE_FIELD") {
      return { ...state, [action.payload.fieldId]: action.payload.value };
    }
    return state;
  };

  const initialLocationState: LocationState = {};
  const locationReducer = (
    state: LocationState,
    action: Action
  ): LocationState => {
    if (action.type === "UPDATE_LOCATION") {
      return { ...state, [action.payload.fieldId]: action.payload.location };
    }
    return state;
  };

  const [formState, dispatchForm] = useReducer(formReducer, initialFormState);
  const [locationState, dispatchLocation] = useReducer(
    locationReducer,
    initialLocationState
  );
  const [trackSelection, setTrackSelection] = useState(false);

  const handleFieldChange = (
    fieldId: number,
    value: any,
    location?: SourceLocation | null
  ) => {
    dispatchForm({ type: "UPDATE_FIELD", payload: { fieldId, value } });
    let nextLocation: SourceLocation | null = location ?? null;
    if (
      nextLocation === null &&
      trackSelection &&
      selection &&
      selection.sourceLocation.length > 0
    ) {
      nextLocation = selection.sourceLocation;
    }
    dispatchLocation({
      type: "UPDATE_LOCATION",
      payload: { fieldId, location: nextLocation },
    });
  };

  useEffect(() => {
    if (!dataExtraction.length) return;
    dataExtraction.forEach((element: any) => {
      dispatchForm({
        type: "UPDATE_FIELD",
        payload: { fieldId: element.protocolElementId, value: element.data },
      });
      dispatchLocation({
        type: "UPDATE_LOCATION",
        payload: {
          fieldId: element.protocolElementId,
          location: element.sourceLocation ?? null,
        },
      });
    });
  }, [dataExtraction]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSave: DataToSave[] = Object.keys(formState).map((fieldId) => {
      const id = parseInt(fieldId, 10);
      return {
        protocolElementId: id,
        data: formState[id],
        sourceLocation: locationState[id] ?? null,
        topicId,
        protocolId: protocol.id,
        paperId,
      };
    });
    handleSubmit(dataToSave, protocol.id, paperId);
  };

  return (
    <form onSubmit={onSubmit} className={cn("h-screen overflow-scroll mb-12")}>
      {!viewOnly && (
        <div className="p-3 mt-4 border rounded-lg bg-secondary flex items-center gap-3">
          <Switch
            id="track-selection"
            checked={trackSelection}
            onCheckedChange={setTrackSelection}
          />
          <div className="flex-1 min-w-0">
            <Label htmlFor="track-selection" className="cursor-pointer">
              Track PDF selection
            </Label>
            <div className="text-xs text-muted-foreground truncate">
              {trackSelection
                ? selection?.text
                  ? `Tracking: "${selection.text.slice(0, 80)}${
                      selection.text.length > 80 ? "…" : ""
                    }"`
                  : "Select text in the PDF to attach it to the next field you change"
                : "When on, edits attach the current PDF selection as the source"}
            </div>
          </div>
        </div>
      )}
      <div
        className={cn(
          "p-4 mt-4 mb-8 border rounded-lg flex flex-col gap-6",
          "overflow-scroll"
        )}
      >
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {section.protocolElements.map((field) => (
              <DataExtractionField
                key={field.id}
                field={field}
                value={formState[field.id]}
                sourceLocation={locationState[field.id] ?? null}
                onChange={(value, location) =>
                  handleFieldChange(field.id, value, location)
                }
                selection={selection}
                resetSelection={resetSelection}
                viewOnly={viewOnly}
                onShowSource={onShowSource}
              />
            ))}
          </div>
        ))}
      </div>

      {!viewOnly && (
        <div className="fixed bottom-0 left-0 right-0 flex gap-4 w-full border p-2 bg-background justify-end pr-6">
          <Button type="submit" variant="primary">
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/topics/${topicId}/topic-papers/${paperId}`);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
};

export default ProtocolForm;
