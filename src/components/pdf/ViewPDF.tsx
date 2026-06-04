"use client";

import { SourceLocation } from "../../../types/DataExtraction";

type ViewPDFProps = {
  fileLocation: string;
  highlight?: SourceLocation | null;
};

                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                backgroundColor: "rgba(255, 215, 0, 0.4)",


  const highlightByPage = useMemo(() => {
    const map = new Map<number, SourceLocation[number]["rects"]>();
    if (!highlight) return map;
    for (const entry of highlight) {
      map.set(entry.page, entry.rects);
    }
    return map;
  }, [highlight]);

  useEffect(() => {
  return (
                key={i}
              />
            ))}
        </div>
  );
}
