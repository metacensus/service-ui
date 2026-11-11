"use client";

import SingleSelectMenu from "@/components/shared/SingleSelectMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { styles } from "@/styles";
import { XIcon } from "lucide-react";
import { useEffect, useId, useMemo, useReducer, useState } from "react";
import { ProtocolElement } from "../../../../types/ProtocolElement";
import { ProtocolSection } from "../../../../types/ProtocolSection";

const PremadeProtocolElement = ({
  protocolOptions,
  addProtocolElement,
  setElementType,
  setOpen,
  section,
  updateSection,
}: {
  protocolOptions: ProtocolElement[];
  addProtocolElement: (element: ProtocolElement) => void;
  setElementType: (value: string) => void;
  setOpen: (value: boolean) => void;
  section: ProtocolSection;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
}) => {
  const [openMenu, setOpenMenu] = useState(false);

  const [selectedElement, setSelectedElement] = useState<ProtocolElement>({
    id: -new Date().getTime(),
    name: "",
    type: "",
    label: "",
    placeholder: "",
    required: false,
    conditionallyShown: false,
    options: [],
    sortOrder: 0,
  });

  const options = useMemo(() => {
    return protocolOptions.map((option) => ({
      id: option.id,
      name: option.name,
    }));
  }, [protocolOptions]);

  return (
    <div className="my-4">
      {options && (
        <SingleSelectMenu
          open={openMenu}
          setOpen={setOpenMenu}
          name="partType"
          options={options}
          onSelect={(_, value) => {
            const foundElement = protocolOptions.find(
              (el) => el.id === value.id
            );
            if (!foundElement) return;
            setSelectedElement({
              ...foundElement,
              id: -new Date().getTime(),
              sortOrder: section.protocolElements.length,
            });

            setOpenMenu(false);
          }}
          selectedItem={selectedElement}
          label="Part Type"
          placeholder="Select Part Type"
          includeSearch={true}
        />
      )}
      {selectedElement && selectedElement.name && (
        <CustomProtocolElement
          selectedElement={selectedElement}
          addProtocolElement={addProtocolElement}
          setOpen={setOpen}
          section={section}
          updateSection={updateSection}
        />
      )}
    </div>
  );
};

interface ElementState {
  type: string;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  conditionallyShown: boolean;
  options: { name: string; value: string }[];
}

type ElementAction =
  | { type: "SET_TYPE"; payload: string }
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_LABEL"; payload: string }
  | { type: "SET_PLACEHOLDER"; payload: string }
  | { type: "SET_REQUIRED"; payload: boolean }
  | { type: "SET_CONDITIONALLY_SHOWN"; payload: boolean }
  | { type: "SET_OPTIONS"; payload: { name: string; value: string }[] }
  | { type: "RESET"; payload: ElementState };

const initialState = {
  type: "text",
  name: "",
  label: "",
  placeholder: "",
  required: false,
  conditionallyShown: false,
  options: [],
};

function elementReducer(
  state: ElementState,
  action: ElementAction
): ElementState {
  switch (action.type) {
    case "SET_TYPE":
      return { ...state, type: action.payload };
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_LABEL":
      return { ...state, label: action.payload };
    case "SET_PLACEHOLDER":
      return { ...state, placeholder: action.payload };
    case "SET_REQUIRED":
      return { ...state, required: action.payload };
    case "SET_CONDITIONALLY_SHOWN":
      return { ...state, conditionallyShown: action.payload };
    case "SET_OPTIONS":
      return { ...state, options: action.payload };
    case "RESET":
      return action.payload || initialState;
    default:
      return state;
  }
}

export const CustomProtocolElement = ({
  selectedElement,
  addProtocolElement,
  setOpen,
  section,
  updateSection,
  editMode = false,
  updateProtocolElement,
}: {
  selectedElement?: ProtocolElement;
  addProtocolElement: (element: ProtocolElement) => void;
  setOpen: (value: boolean) => void;
  section: ProtocolSection;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
  editMode?: boolean;
  updateProtocolElement?: (element: ProtocolElement) => void;
}) => {
  const formOptions = [
    {
      name: "Text",
      type: "text",
      id: "text-input",
    },
    {
      name: "Multi-line Text",
      type: "textarea",
      id: "textarea-input",
    },
    {
      name: "Number",
      type: "number",
      id: "number-input",
    },
    {
      name: "Date",
      type: "date",
      id: "date-input",
    },
    {
      name: "Radio",
      type: "radio",
      id: "radio-input",
    },
    {
      name: "Checkbox",
      type: "checkbox",
      id: "checkbox-input",
    },
  ];
  const uid = useId();
  const [state, dispatch] = useReducer(elementReducer, {
    type: selectedElement?.type || "text",
    name: selectedElement?.name || "",
    label: selectedElement?.label || "",
    placeholder: selectedElement?.placeholder || "",
    required: selectedElement?.required || false,
    conditionallyShown: selectedElement?.conditionallyShown || false,
    options: selectedElement?.options || [],
  });

  useEffect(() => {
    dispatch({
      type: "RESET",
      payload: {
        type: selectedElement?.type || "text",
        name: selectedElement?.name || "",
        label: selectedElement?.label || "",
        placeholder: selectedElement?.placeholder || "",
        required: selectedElement?.required || false,
        conditionallyShown: selectedElement?.conditionallyShown || false,
        options: selectedElement?.options || [],
      },
    });
  }, [selectedElement]);

  return (
    <div>
      <Card className="flex flex-col gap-2 xl:grid grid-cols-2 xl:gap-6 xl:p-6 mt-4 border-0 shadow-none xl:shadow-sm xl:border">
        <div className="w-full">
          <Label htmlFor={`${uid}-type`}>Field Type</Label>
          <Select
            onValueChange={(e) => dispatch({ type: "SET_TYPE", payload: e })}
            value={state.type}
          >
            <SelectTrigger id={`${uid}-type`} className="w-full">
              <SelectValue placeholder="Field Type" />
            </SelectTrigger>
            <SelectContent>
              {formOptions.map((option) => (
                <SelectItem key={option.id} value={option.type}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${uid}-label`}>Field Label</Label>
          <Input
            id={`${uid}-label`}
            value={state.label}
            onChange={(e) =>
              dispatch({ type: "SET_LABEL", payload: e.target.value })
            }
            placeholder="Field Label"
          />
        </div>

        {state.type !== "date" &&
          state.type !== "radio" &&
          state.type !== "checkbox" && (
            <div>
              <Label htmlFor={`${uid}-placeholder`}>Field Placeholder</Label>
              <Input
                id={`${uid}-placeholder`}
                value={state.placeholder}
                onChange={(e) =>
                  dispatch({ type: "SET_PLACEHOLDER", payload: e.target.value })
                }
                placeholder="Field Placeholder"
              />
            </div>
          )}
        {/* {(elementType === "radio" || elementType === "checkbox") && ( */}
        {(state.type === "radio" || state.type === "checkbox") && (
          <div>
            <Label asChild><span>Options</span></Label>

            <Card className="p-2">
              <div className="flex gap-4 items-center">
                <div className="h-10 w-full px-1 py-2 text-sm">Name</div>
                <div className="h-10 w-full px-1 py-2 text-sm">Value</div>
                <XIcon className="text-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                {state.options.map(
                  (
                    option: {
                      name: string;
                      value: string;
                    },
                    index: number
                  ) => (
                    <div key={index} className="flex gap-4 items-center">
                      <Input
                        id={`${uid}-option-${index}-name`}
                        aria-label="Option Name"
                        value={option.name}
                        onChange={(e) => {
                          dispatch({
                            type: "SET_OPTIONS",
                            payload: state.options.map(
                              (
                                item: {
                                  name: string;
                                  value: string;
                                },
                                i: number
                              ) => {
                                if (i === index) {
                                  return { ...item, name: e.target.value };
                                }
                                return item;
                              }
                            ),
                          });
                        }}
                        placeholder="Option Name"
                      />
                      <Input
                        id={`${uid}-option-${index}-value`}
                        aria-label="Option Value"
                        value={option.value}
                        onChange={(e) => {
                          dispatch({
                            type: "SET_OPTIONS",
                            payload: state.options.map(
                              (
                                item: {
                                  name: string;
                                  value: string;
                                },
                                i: number
                              ) => {
                                if (i === index) {
                                  return { ...item, value: e.target.value };
                                }
                                return item;
                              }
                            ),
                          });
                        }}
                        placeholder="Option Value"
                      />
                      <XIcon
                        className="cursor-pointer"
                        onClick={() => {
                          dispatch({
                            type: "SET_OPTIONS",
                            payload: state.options.filter(
                              (
                                _: {
                                  name: string;
                                  value: string;
                                },
                                i: number
                              ) => i !== index
                            ),
                          });
                        }}
                      />
                    </div>
                  )
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch({
                      type: "SET_OPTIONS",
                      payload: [...state.options, { name: "", value: "" }],
                    });
                  }}
                >
                  Add Option
                </Button>
              </div>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="xl:mr-8">
            <RadioGroup aria-labelledby={`${uid}-required`}>
              <Label asChild><span id={`${uid}-required`}>Required?</span></Label>
              <div className="flex gap-2">
                <div className="flex gap-1">
                  <input
                    id={`${uid}-required-yes`}
                    type="radio"
                    className="h-4 w-4"
                    checked={state.required}
                    onChange={() =>
                      dispatch({ type: "SET_REQUIRED", payload: true })
                    }
                  />
                  <Label htmlFor={`${uid}-required-yes`}>Yes</Label>
                </div>
                <div className="flex gap-1">
                  <input
                    id={`${uid}-required-no`}
                    type="radio"
                    className="h-4 w-4"
                    checked={!state.required}
                    onChange={() =>
                      dispatch({ type: "SET_REQUIRED", payload: false })
                    }
                  />
                  <Label htmlFor={`${uid}-required-no`}>No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div>
            <RadioGroup aria-labelledby={`${uid}-shown`}>
              <Label asChild><span id={`${uid}-shown`}>Conditionally Shown?</span></Label>
              <div className="flex gap-2">
                <div className="flex gap-1">
                  <input
                    id={`${uid}-shown-yes`}
                    type="radio"
                    className="h-4 w-4"
                    checked={state.conditionallyShown}
                    onChange={() =>
                      dispatch({
                        type: "SET_CONDITIONALLY_SHOWN",
                        payload: true,
                      })
                    }
                  />
                  <Label htmlFor={`${uid}-shown-yes`}>Yes</Label>
                </div>
                <div className="flex gap-1">
                  <input
                    id={`${uid}-shown-no`}
                    type="radio"
                    className="h-4 w-4"
                    checked={!state.conditionallyShown}
                    onChange={() =>
                      dispatch({
                        type: "SET_CONDITIONALLY_SHOWN",
                        payload: false,
                      })
                    }
                  />
                  <Label htmlFor={`${uid}-shown-no`}>No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      <div className="flex mt-4 gap-4">
        <Button
          variant="primary"
          disabled={!state.label}
          onClick={() => {
            const id = selectedElement?.id || -new Date().getTime();

            const elementData = {
              id,
              name: state.name,
              type: state.type,
              label: state.label,
              placeholder: state.placeholder,
              required: state.required,
              conditionallyShown: state.conditionallyShown,
              options: state.options,
              sortOrder: selectedElement?.sortOrder || 0,
            };

            if (editMode && updateProtocolElement) {
              updateProtocolElement(elementData);
            } else {
              addProtocolElement({
                ...elementData,
                sortOrder: section.protocolElements.length,
              });

              updateSection(section.id, {
                ...section,
                protocolElements: [
                  ...section.protocolElements,
                  {
                    ...elementData,
                    sortOrder: section.protocolElements.length,
                  },
                ],
              });

              dispatch({ type: "RESET", payload: initialState });
            }

            setOpen(false);
          }}
        >
          {editMode ? "Edit" : "Save"} Part
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const SelectProtocolElement = ({
  protocolOptions,
  addProtocolElement,
  setOpen,
  section,
  updateSection,
}: {
  protocolOptions: ProtocolElement[];
  addProtocolElement: (element: ProtocolElement) => void;
  setOpen: (value: boolean) => void;
  section: ProtocolSection;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
}) => {
  const [elementType, setElementType] = useState("");

  return (
    <div className="flex flex-col">
      <div className="flex w-full justify-between mb-6">
        <h1 className={cn(styles.h4, "font-bold")}>Protocol Part</h1>
        <XIcon className="cursor-pointer" onClick={() => setOpen(false)} />
      </div>
      <div>
        <RadioGroup>
          <div className="flex gap-4 md:gap-12 flex-col md:flex-row">
            <div
              className="flex gap-1 items-center cursor-pointer"
              onClick={() => setElementType("premade")}
            >
              <input
                id="element-type-premade"
                className="ml-auto h-4 w-4"
                type="radio"
                value="premade"
                checked={elementType === "premade"}
              />
              <label
                htmlFor="element-type-premade"
                className="mc-label cursor-pointer"
              >
                Premade Type
              </label>
            </div>

            <div
              className="flex gap-1 items-center cursor-pointer"
              onClick={() => setElementType("custom")}
            >
              <input
                id="element-type-custom"
                className="ml-auto h-4 w-4"
                type="radio"
                value="custom"
                checked={elementType === "custom"}
              />
              <label
                htmlFor="element-type-custom"
                className="mc-label cursor-pointer"
              >
                Custom Field
              </label>
            </div>
          </div>
        </RadioGroup>
      </div>
      {elementType === "premade" && (
        <PremadeProtocolElement
          protocolOptions={protocolOptions}
          addProtocolElement={addProtocolElement}
          setElementType={setElementType}
          setOpen={setOpen}
          section={section}
          updateSection={updateSection}
        />
      )}
      {elementType === "custom" && (
        <CustomProtocolElement
          addProtocolElement={addProtocolElement}
          setOpen={setOpen}
          section={section}
          updateSection={updateSection}
        />
      )}
    </div>
  );
};

type CreateProtocolElementProps = {
  addProtocolElement: (element: ProtocolElement) => void;
  removeProtocolElement: (element: ProtocolElement) => void;
  setOpen: (value: boolean) => void;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
  section: ProtocolSection;
};

const CreateProtocolElement = ({
  addProtocolElement,
  removeProtocolElement,
  setOpen,
  updateSection,
  section,
}: CreateProtocolElementProps) => {
  const { data, error, isLoading } = useFetchData(
    routes.api.protocolElement,
    [`protocol-elements`],
    "POST",
    { ids: [] }
  );

  const protocolOptions = useMemo(() => {
    if (data) {
      return data as ProtocolElement[];
    }
    return [];
  }, [data]);

  return (
    <Card className="p-6">
      {isLoading && <div>Loading...</div>}
      {error && <div>Error loading data</div>}
      <SelectProtocolElement
        protocolOptions={protocolOptions}
        addProtocolElement={addProtocolElement}
        setOpen={setOpen}
        section={section}
        updateSection={updateSection}
      />
    </Card>
  );
};

export default CreateProtocolElement;
