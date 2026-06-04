"use client";

import { useMemo } from "react";
import { Vote } from "../../../types/vote";

export const StatementHeatmap = ({
  statement = "",
  votes = [],
}: {
  statement: string;
  votes: Vote[];
}) => {

  const statementAsArray = statement.split("");

  const hue = 255;

  return (
    <div>
        {statementAsArray.map((char, index) => {
              return acc + 1;
            }
            return acc;
          }, 0);

          const lightness =
            citations.length === 0 || weight === 0
              ? 100
              : Math.max(
                  15,
                  Math.min(90, 100 - (weight / citations.length) * 70)
                );

          return (
            <span
              key={index}
              style={{
                backgroundColor: `hsla(${hue}, 100%, ${lightness}%, 0.5)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </p>
    </div>
  );
};
