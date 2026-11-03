import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { useState } from "react";
import { Protocol } from "../../../../types/Protocol";
import { ProtocolSection } from "../../../../types/ProtocolSection";
import CreateProtocolSection from "../CreateProtocol/CreateProtocolSection";

const EditProtocol = ({
  setDrawerOpen,
  protocol,
  topicId,
}: {
  setDrawerOpen: (open: boolean) => void;
  protocol: Protocol;
  topicId: string;
}) => {
  // Initialize sections with isNew set to false for existing sections
  const [sections, setSections] = useState<ProtocolSection[]>(
    protocol.protocolSections
  );

  const updateSortOrder = (sectionIndex: number, moveDirection: string) => {
    // Prevent moving the first section up or the last section down
    if (
      (moveDirection === "up" && sectionIndex === 0) ||
      (moveDirection === "down" && sectionIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];

    if (moveDirection === "up") {
      const currentSection = newSections[sectionIndex];
      const aboveSection = newSections[sectionIndex - 1];

      // Swap sortOrder values
      [currentSection.sortOrder, aboveSection.sortOrder] = [
        aboveSection.sortOrder,
        currentSection.sortOrder,
      ];

      // Swap positions in the array
      newSections[sectionIndex - 1] = currentSection;
      newSections[sectionIndex] = aboveSection;
    }

    if (moveDirection === "down") {
      const currentSection = newSections[sectionIndex];
      const belowSection = newSections[sectionIndex + 1];

      // Swap sortOrder values
      [currentSection.sortOrder, belowSection.sortOrder] = [
        belowSection.sortOrder,
        currentSection.sortOrder,
      ];

      // Swap positions in the array
      newSections[sectionIndex + 1] = currentSection;
      newSections[sectionIndex] = belowSection;
    }

    // Update the state
    setSections(newSections);
  };

  const updateSection = (sectionId: number, newSection: ProtocolSection) => {
    const newSections = sections.map((section) =>
      section.id === sectionId ? newSection : section
    );
    setSections(newSections);
  };

  return (
    <div className="flex flex-col gap-4">
      {sections
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section, index) => (
          <CreateProtocolSection
            key={section.id}
            section={section}
            updateSortOrder={updateSortOrder}
            index={index}
            sectionsLength={sections.length}
            updateSection={updateSection}
          />
        ))}
      <Card>
        <button
          type="button"
          onClick={() =>
            setSections([
              ...sections,
              {
                title: "",
                id: -new Date().getTime(),
                sortOrder: sections.length,
                protocolElements: [],
              },
            ])
          }
        >
        </button>
      </Card>
      <div className="flex mt-4 gap-4">
        <Button
          variant="primary"
          onClick={async () => {
            const data = {
              sections: sections,
              protocolId: protocol.id,
            };

            const headers = getAuthHeaders();

            const editProtocol = await fetch(routes.api.protocolEdit, {
              method: "POST",
              headers,
              body: JSON.stringify(data),
            });

            const response = await editProtocol.json();
            if (response?.message === "Protocol edit successful") {
              await queryClient.refetchQueries({
                queryKey: [`topics-dashboard-${topicId}`],
              });
              await queryClient.refetchQueries({
                queryKey: [`topic-details-${topicId}`],
              });

              setDrawerOpen(false);
            }
          }}
        >
          Edit Protocol
        </Button>
        <Button variant="outline" onClick={() => setDrawerOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditProtocol;
