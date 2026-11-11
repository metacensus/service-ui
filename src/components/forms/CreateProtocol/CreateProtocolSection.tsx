import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ProtocolElement } from "../../../../types/ProtocolElement";
import { ProtocolSection } from "../../../../types/ProtocolSection";
import CreateProtocolElement, {
  CustomProtocolElement,
} from "./CreateProtocolElement";

type ProtocolElementCardProps = {
  element: ProtocolElement;
  index: number;
  updateSortOrderElements: (elementId: number, moveDirection: string) => void;
  protocolElements: ProtocolElement[];
  setProtocolElements: (elements: ProtocolElement[]) => void;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
  section: ProtocolSection;
  addProtocolElement: (element: ProtocolElement) => void;
};

const ProtocolElementCard = ({
  element,
  index,
  updateSortOrderElements,
  protocolElements,
  setProtocolElements,
  updateSection,
  section,
  addProtocolElement,
}: ProtocolElementCardProps) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const updateProtocolElement = (newElement: ProtocolElement) => {
    const newElements = protocolElements.map((el) =>
      el.id === newElement.id ? newElement : el
    );
    setProtocolElements(newElements);
    updateSection(section.id, {
      ...section,
      protocolElements: newElements,
    });
  };

  if (!isEditMode) {
    return (
      <Card key={element.id} className="p-4 bg-secondary">
        <div className="flex items-center w-full">
          <ProtocolElementRow element={element} />
          <div className="flex gap-4 ml-auto">
            {index !== 0 && (
                onClick={() => {
                  updateSortOrderElements(element.id, "up");
                }}
              />
            )}
            {index !== protocolElements.length - 1 && (
                onClick={() => {
                  updateSortOrderElements(element.id, "down");
                }}
              />
            )}
              onClick={() => {
                setIsEditMode(true);
              }}
            />
              onClick={() => {
                const newProtocolElements = [...protocolElements];
                newProtocolElements.splice(index, 1);
                setProtocolElements(newProtocolElements);
              }}
            />
          </div>
        </div>
      </Card>
    );
  }
  return (
    <CustomProtocolElement
      selectedElement={element}
      addProtocolElement={addProtocolElement}
      setOpen={setIsEditMode}
      section={section}
      updateSection={updateSection}
      editMode={true}
      updateProtocolElement={updateProtocolElement}
    />
  );
};

const ProtocolElementRow = ({ element }: { element: ProtocolElement }) => {
  if (
    element.type === "text" ||
    element.type === "number" ||
    element.type === "date"
  ) {
    return (
      <div className="w-full">
        <Label htmlFor={`preview-${element.id}`}>
          {element.label}
          {element.required && (
            <>
              <span>*</span>
              <span className="text-xs text-muted-foreground ml-1">(Required)</span>
            </>
          )}
        </Label>
        <Input
          id={`preview-${element.id}`}
          className="w-full max-w-xl p-3 text-sm font-semibold disabled:opacity-100 disabled:cursor-default"
          type={element.type}
          placeholder={element.placeholder ? element.placeholder : element.name}
          disabled
        />
      </div>
    );
  }
  if (element.type === "textarea") {
    return (
      <div className="w-full">
        <Label htmlFor={`preview-${element.id}`}>{element.label}</Label>
        <Textarea
          id={`preview-${element.id}`}
          className="w-full max-w-xl p-3 text-sm font-semibold disabled:opacity-100 disabled:cursor-default"
          placeholder={element.placeholder ? element.placeholder : element.name}
          disabled
        />
      </div>
    );
  }
  if (element.type === "radio") {
    return (
      <div className="w-full">
        <Label asChild><span>{element.label}</span></Label>
        <div className="flex flex-col gap-2">
          {element.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                className="h-4 w-4"
                id={`preview-${element.id}-${index}`}
                name={element.name}
                value={option.value}
                disabled
              />
              <label
                htmlFor={`preview-${element.id}-${index}`}
                className="text-foreground"
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (element.type === "checkbox") {
    return (
      <div className="w-full">
        <Label asChild><span>{element.label}</span></Label>
        <div className="flex flex-col gap-2">
          {element.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                className="disabled:opacity-100 disabled:cursor-default"
                id={`preview-${element.id}-${index}`}
                name={element.name}
                value={option.value}
                disabled
              />
              <label
                htmlFor={`preview-${element.id}-${index}`}
                className="text-foreground"
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

type CreateProtocolSectionProps = {
  section: ProtocolSection;
  updateSortOrder: (sectionId: number, moveDirection: string) => void;
  index: number;
  sectionsLength: number;
  updateSection: (sectionId: number, newSection: ProtocolSection) => void;
};

const CreateProtocolSection = ({
  section,
  updateSortOrder,
  sectionsLength,
  updateSection,
}: CreateProtocolSectionProps) => {
  const [sectionName, setSectionName] = useState(section.title || "");

  const [protocolElements, setProtocolElements] = useState<ProtocolElement[]>(
    section.protocolElements || []
  );

  const addProtocolElement = (element: ProtocolElement) => {
    setProtocolElements([...protocolElements, element]);
  };

  const removeProtocolElement = (element: ProtocolElement) => {
    const newProtocolElements = [...protocolElements];
    newProtocolElements.splice(newProtocolElements.indexOf(element), 1);
    setProtocolElements(newProtocolElements);
  };

  const [openAddProtocolElement, setOpenAddProtocolElement] = useState(false);

  const updateSortOrderElements = (
    elementId: number,
    moveDirection: string
  ) => {
    const elementIndex = protocolElements.findIndex(
      (element) => element.id === elementId
    );

    // Prevent moving the first section up or the last section down
    if (
      (moveDirection === "up" && elementIndex === 0) ||
      (moveDirection === "down" && elementIndex === protocolElements.length - 1)
    ) {
      return;
    }

    const newElements = [...protocolElements];

    if (moveDirection === "up") {
      // Swap the current section with the section above it
      const currentElement = newElements[elementIndex];
      const aboveElement = newElements[elementIndex - 1];

      // Swap sortOrder values
      [currentElement.sortOrder, aboveElement.sortOrder] = [
        aboveElement.sortOrder,
        currentElement.sortOrder,
      ];

      // Swap positions in the array
      newElements[elementIndex - 1] = currentElement;
      newElements[elementIndex] = aboveElement;
    }

    if (moveDirection === "down") {
      // Swap the current section with the section below it
      const currentElement = newElements[elementIndex];
      const belowElement = newElements[elementIndex + 1];

      // Swap sortOrder values
      [currentElement.sortOrder, belowElement.sortOrder] = [
        belowElement.sortOrder,
        currentElement.sortOrder,
      ];

      // Swap positions in the array
      newElements[elementIndex + 1] = currentElement;
      newElements[elementIndex] = belowElement;
    }

    // Sort the sections array by sortOrder to ensure the correct order
    newElements.sort((a, b) => (a?.sortOrder || 0) - (b?.sortOrder || 0));

    // Update the state
    setProtocolElements(newElements);

    // Update the section
    updateSection(section.id, {
      ...section,
      protocolElements: newElements,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center w-full">
          <div className="flex flex-col w-full gap-2">
            <Label htmlFor={`section-name-${section.id}`} className="pl-1">
              Section Name
            </Label>
            <Input
              id={`section-name-${section.id}`}
              value={sectionName}
              onChange={(e) => {
                setSectionName(e.target.value);
                updateSection(section.id, {
                  ...section,
                  title: e.target.value,
                });
              }}
              placeholder="Section Name"
              className="w-full max-w-xl"
              type="text"
            />
          </div>
          <div className="flex gap-4 ml-auto">
            {section.sortOrder !== 0 && (
                onClick={() => {
                  updateSortOrder(section.id, "up");
                }}
              />
            )}
            {section.sortOrder !== sectionsLength - 1 && (
                onClick={() => {
                  updateSortOrder(section.id, "down");
                }}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {protocolElements.map((element: ProtocolElement, index: number) => (
            <ProtocolElementCard
              key={element.id}
              element={element}
              index={index}
              updateSortOrderElements={updateSortOrderElements}
              protocolElements={protocolElements}
              setProtocolElements={setProtocolElements}
              updateSection={updateSection}
              section={section}
              addProtocolElement={addProtocolElement}
            />
          ))}
        </div>
        {openAddProtocolElement && (
          <CreateProtocolElement
            addProtocolElement={addProtocolElement}
            removeProtocolElement={removeProtocolElement}
            setOpen={setOpenAddProtocolElement}
            updateSection={updateSection}
            section={section}
          />
        )}
        <Card>
          <button
            type="button"
            onClick={() => setOpenAddProtocolElement(true)}
            className="flex justify-center py-4 bg-secondary items-center gap-2 text-sm font-bold text-foreground cursor-pointer hover:underline w-full"
          >
          </button>
        </Card>
      </div>
    </Card>
  );
};

export default CreateProtocolSection;
