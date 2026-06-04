// ProtocolElement.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PdfSelection } from "@/lib/pdfSelection";
import { format, isValid, parse } from "date-fns";
import React, { ChangeEvent } from "react";
import { SourceLocation } from "../../../../types/DataExtraction";
import { ProtocolElement } from "../../../../types/ProtocolElement";

interface DataExtractionFieldProps {
  field: ProtocolElement;
  value: any;
  sourceLocation?: SourceLocation | null;
  onChange: (value: any, location?: SourceLocation | null) => void;
  selection?: PdfSelection | null;
  resetSelection: () => void;
  viewOnly?: boolean;
  onShowSource?: (location: SourceLocation | null) => void;
}

const dateFormats = [
  "MM/dd/yyyy",
  "M/d/yyyy",
  "dd/MM/yyyy",
  "d/M/yyyy",
  "yyyy-MM-dd",
  "dd MMM yyyy",
  "dd MMMM yyyy",
  "MMMM d, yyyy",
  "MMM d, yyyy",
  "MMMM d yyyy",
  "MMM d yyyy",
];

const DataExtractionField: React.FC<DataExtractionFieldProps> = ({
  field,
  value,
  sourceLocation,
  onChange,
  selection,
  resetSelection,
  viewOnly = false,
  onShowSource,
}) => {
  const { type } = field;

  const hasSource = !!(sourceLocation && sourceLocation.length > 0);
  const showSourceButton = viewOnly && hasSource && !!onShowSource;
  const sourceButton = showSourceButton ? (
    <button
      type="button"
      title="Show in PDF"
      onClick={() => onShowSource?.(sourceLocation ?? null)}
    >
    </button>
  ) : null;

  const renderLabel = () => (
      <span>
        {field.label}
        {field.required && (
          <>
            <span>*</span>
          </>
        )}
      </span>
      {sourceButton}
    </Label>
  );

  if (type !== "radio" && type !== "checkbox" && type !== "textarea") {
    return (
      <div>
        {renderLabel()}
        <div className="flex gap-2 items-center">
          <Input
            type={type}
            disabled={viewOnly}
            value={value || ""}
            placeholder={field.placeholder}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value, null)
            }
          />
          {!value && selection?.text && !viewOnly && (
              onClick={() => {
                if (type === "date") {
                  let parsedDate = null;
                  const normalizedText = selection.text.replace(
                    /\bSept\b/gi,
                    "Sep"
                  );
                  for (const formatString of dateFormats) {
                    parsedDate = parse(
                      normalizedText,
                      formatString,
                      new Date()
                    );
                    if (isValid(parsedDate)) break;
                  }
                  if (parsedDate && isValid(parsedDate)) {
                    const formattedDate = format(parsedDate, "yyyy-MM-dd");
                    onChange(formattedDate, selection.sourceLocation);
                  } else {
                    alert(
                      "The selected text could not be parsed as a valid date."
                    );
                  }
                } else {
                  onChange(selection.text, selection.sourceLocation);
                }
                resetSelection();
              }}
            />
          )}
        </div>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div>
        {renderLabel()}
        <div className="flex gap-2 items-center">
          <Textarea
            disabled={viewOnly}
            value={value || ""}
            placeholder={field.placeholder}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value, null)
            }
          />
          {!value && selection?.text && !viewOnly && (
              onClick={() => {
                onChange(selection.text, selection.sourceLocation);
                resetSelection();
              }}
            />
          )}
        </div>
      </div>
    );
  }

  if (type === "checkbox" && field.options) {
    return (
          <span>
            {field.label}
            {field.required && (
              <>
                <span>*</span>
              </>
            )}
          </span>
          {sourceButton}
        <div className="mt-2 space-y-2">
          {field.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                id={`field_${field.id}_option_${index}`}
                type="checkbox"
                disabled={viewOnly}
                name={`field_${field.id}`}
                value={option.value}
                checked={(value || []).includes(option.value)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const prevValues: string[] = value || [];
                  let newValues: string[];
                  if (e.target.checked) {
                    newValues = [...prevValues, option.value];
                  } else {
                    newValues = prevValues.filter(
                      (val) => val !== option.value
                    );
                  }
                  onChange(newValues, null);
                }}
              />
              <label
                htmlFor={`field_${field.id}_option_${index}`}
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "radio" && field.options) {
    return (
          <span>
            {field.label}
            {field.required && (
              <>
                <span>*</span>
              </>
            )}
          </span>
          {sourceButton}
        <div className="mt-2 space-y-2">
          {field.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                disabled={viewOnly}
                id={`field_${field.id}_option_${index}`}
                type="radio"
                name={`field_${field.id}`}
                value={option.value}
                checked={value === option.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  onChange(e.target.value, null);
                }}
              />
              <label
                htmlFor={`field_${field.id}_option_${index}`}
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default DataExtractionField;
