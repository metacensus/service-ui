"use client";

import { Card, CardContent } from "@/components/ui/card";

type ReviewProgressHeaderProps = {
};

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
            </span>{" "}
          </div>
          <div className="text-sm">
              <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
              </span>
            ) : (
              </span>
            )}
          </div>
        </div>

            const pct = progress.total
              ? Math.round((progress.made / progress.total) * 100)
              : 0;
            return (
                <div className="flex items-baseline justify-between text-xs">
                  <span className={`font-bold ${accent.text}`}>
                  </span>
                  </span>
                </div>
                  <div
                    className={`h-1.5 rounded-full ${accent.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
};

export default ReviewProgressHeader;
