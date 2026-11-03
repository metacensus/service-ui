"use client";

import ProtocolForm from "@/components/forms/DataExtraction/ProtocolForm";
import { getAuthHeaders } from "@/functions/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import { useFetchData } from "@/hooks/useFetchData";
import queryClient from "@/lib/queryClient";
import { capturePdfSelection, PdfSelection } from "@/lib/pdfSelection";
import { routes } from "@/lib/routes";
import { useRouter, useSearchParams } from "@/lib/next-navigation-compat";
import { lazy, Suspense, useMemo, useRef, useState } from "react";

const ViewPDF = lazy(() => import("@/components/pdf/ViewPDF"));
import { SourceLocation } from "../../../../../../../types/DataExtraction";
import { Protocol } from "../../../../../../../types/Protocol";

const TopicExtraction = ({
  params: { topicId, paperId },
}: {
  params: { topicId: string; paperId: string };
}) => {
  const searchParams = useSearchParams();
  const extractionReviewId = searchParams.get("extractionReviewId");

  const viewOnly = searchParams.get("viewOnly") === "true" ? true : false;
  const isEditMode = searchParams.get("isEditMode") === "true" ? true : false;

  const router = useRouter();

  const { data: presignedUrlData } = useFetchData<undefined, any>(
    routes.api.paperPresignedUrl(paperId),
    [`paper-presigned-url-${paperId}`],
    "GET"
  );

  const { data: protocol } = useFetchData<undefined, Protocol | null>(
    routes.api.topicProtocol(topicId),
    [`topic-protocol-${topicId}`]
  );

  const paperUrlLocation = useMemo(() => {
    if (presignedUrlData) {
      return presignedUrlData.url;
    }
    return "";
  }, [presignedUrlData]);

  const [selection, setSelection] = useState<PdfSelection | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<SourceLocation | null>(
    null
  );
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const handleTextSelection = () => {
    if (!pdfContainerRef.current) return;
    const captured = capturePdfSelection(pdfContainerRef.current);
    setSelection(captured);
  };

  const resetSelection = () => {
    setSelection(null);
  };

  const saveExtraction = async (
    data: any,
    protocolId: number,
    paperId: number
  ) => {
    if (viewOnly) return;

    const headers = getAuthHeaders();

    if (!isEditMode) {
      const update = await fetch(routes.api.extractionCreate, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data,
          protocolId,
          paperId,
          topicId,
        }),
      });
      const response = await update.json();
      if (response?.status === 200) {
        await queryClient.invalidateQueries({
          queryKey: [`topics-papers-${topicId}-${paperId}`],
        });
        toast({
          title: "Data Extraction",
          description: "Data extraction saved successfully",
        });
        router.push(`/topics/${topicId}/topic-papers/${paperId}`);
      }
    } else {
      const update = await fetch(routes.api.extractionEdit, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data,
          protocolId,
          paperId,
          topicId,
          extractionReviewId,
        }),
      });
      const response = await update.json();
      if (response?.status === 200) {
        await queryClient.invalidateQueries({
          queryKey: [`topics-papers-${topicId}-${paperId}`],
        });
        toast({
          title: "Data Extraction",
          description: "Data extraction saved successfully",
        });
        router.push(`/topics/${topicId}/topic-papers/${paperId}`);
      }
    }
  };

  return (
    <div>
      <h1 className="m-6 font-bold text-3xl">Data Extraction</h1>
      <div className="flex flex-col xl:flex-row gap-4">
        {paperUrlLocation && (
          <div
            className="w-full xl:w-2/3 max-h-screen overflow-scroll"
            ref={pdfContainerRef}
            onMouseUp={handleTextSelection}
            onMouseLeave={handleTextSelection}
            onKeyUp={handleTextSelection}
          >
            <Suspense fallback={null}>
              <ViewPDF
                fileLocation={paperUrlLocation}
                highlight={activeHighlight}
              />
            </Suspense>
          </div>
        )}
        <div className="w-full xl:w-1/3">
          {protocol && (
            <ProtocolForm
              protocol={protocol}
              handleSubmit={saveExtraction}
              selection={selection}
              resetSelection={resetSelection}
              topicId={topicId}
              paperId={+paperId}
              extractionReviewId={extractionReviewId}
              viewOnly={viewOnly}
              onShowSource={(location) =>
                setActiveHighlight(location ? [...location] : null)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicExtraction;
