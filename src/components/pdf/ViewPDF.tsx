"use client";

import { SourceLocation } from "../../../types/DataExtraction";

type ViewPDFProps = {
  fileLocation: string;
  highlight?: SourceLocation | null;
  citedPage?: number | null;
};

                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                backgroundColor: "rgba(255, 215, 0, 0.4)",
export default function ViewPDF({
  fileLocation,
  highlight,
  citedPage,
}: ViewPDFProps) {

  useEffect(() => {
  }, [fileLocation]);


  const highlightByPage = useMemo(() => {
    const map = new Map<number, SourceLocation[number]["rects"]>();
    if (!highlight) return map;
    for (const entry of highlight) {
      map.set(entry.page, entry.rects);
    }
    return map;
  }, [highlight]);

  const targetPage = useMemo(() => {
    const highlightedPage =
      highlight?.find((entry) => entry.rects.length > 0)?.page ??
      highlight?.[0]?.page ??
      null;
    const page = highlightedPage ?? citedPage ?? null;
    return Number.isInteger(page) && page !== null && page > 0 ? page : null;
  }, [citedPage, highlight]);

  useEffect(() => {
  return (
                key={i}
              />
            ))}
        </div>
  );
}
