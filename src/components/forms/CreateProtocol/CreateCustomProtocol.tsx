import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import queryClient from "@/lib/queryClient";
import { routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { Protocol } from "../../../../types/Protocol";
import { ProtocolSection } from "../../../../types/ProtocolSection";
import CreateProtocolSection from "./CreateProtocolSection";

const CreateCustomProtocol = ({
  setDrawerOpen,
  selectedProtocol,
  topicId,
}: {
  setDrawerOpen: (open: boolean) => void;
  selectedProtocol?: Protocol;
  topicId: string;
}) => {
  const [sections, setSections] = useState<ProtocolSection[]>([
    {
      title: "",
      id: 0,
      sortOrder: 0,
      protocolElements: [],
    },
  ]);

  useEffect(() => {
    if (selectedProtocol) {
      setSections(selectedProtocol.protocolSections);
    }
  }, [selectedProtocol]);

  const updateSortOrder = (sectionId: number, moveDirection: string) => {
    const sectionIndex = sections.findIndex(
      (section) => section.id === sectionId
    );

    // Prevent moving the first section up or the last section down
    if (
      (moveDirection === "up" && sectionIndex === 0) ||
      (moveDirection === "down" && sectionIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];

    if (moveDirection === "up") {
      // Swap the current section with the section above it
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
      // Swap the current section with the section below it
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

    // Sort the sections array by sortOrder to ensure the correct order
    newSections.sort((a, b) => a.sortOrder - b.sortOrder);

    // Update the state
    setSections(newSections);
  };

  const updateSection = (sectionId: number, newSection: ProtocolSection) => {
    const newSections = [...sections];
    const sectionIndex = newSections.findIndex(
      (section) => section.id === sectionId
    );

    newSections[sectionIndex] = newSection;

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
            sectionsLength={sections ? sections.length : 0}
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
                id: sections.length,
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
              protocol: {
                title: "Custom Protocol",
                sections: sections,
                topicId: topicId,
              },
            };

            const headers = getAuthHeaders();
            const createTopic = await fetch(routes.api.protocolCreate, {
              method: "POST",
              headers,
              body: JSON.stringify(data),
            });

            const response = await createTopic.json();
            if (response?.message === "Protocol created successfully") {
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
          Save Protocol
        </Button>
        <Button variant="outline" onClick={() => setDrawerOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CreateCustomProtocol;
