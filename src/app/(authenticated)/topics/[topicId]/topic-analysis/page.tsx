"use client";

import type { ReactNode } from "react";

type AnalysisOption = {
  title: string;
  body: `You could ${string}`;
  icon: ReactNode;
};

const ANALYSIS_OPTIONS: readonly [AnalysisOption, AnalysisOption, AnalysisOption] = [
  {
    title: "A. Download the data",
    body: "You could take the reviewed data and use your own tools.",
    icon: (
      <>
        <rect x="4" y="3" width="20" height="22" rx="2" />
        <line x1="14" y1="8" x2="14" y2="18" />
        <polyline points="10,14 14,18 18,14" />
      </>
    ),
  },
  {
    title: "B. Hosted workspace",
    body: "You could work in a hosted space alongside the data.",
    icon: (
      <>
        <rect x="3" y="5" width="22" height="14" rx="2" />
        <line x1="3" y1="10" x2="25" y2="10" />
        <rect x="11" y="19" width="6" height="3" fill="currentColor" stroke="none" />
        <line x1="8" y1="24" x2="20" y2="24" />
      </>
    ),
  },
  {
    title: "C. Statistical chat assistant",
    body: "You could ask an assistant for help with statistics.",
    icon: (
      <>
        <rect x="4" y="4" width="20" height="14" rx="4" />
        <polyline points="10,22 10,18 14,18" />
        <circle cx="10.5" cy="11" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="14" cy="11" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="11" r="1.3" fill="currentColor" stroke="none" />
      </>
    ),
  },
];

const TopicAnalysis = () => {
  return (
    <div className="mt-6">
        Analysis
      </p>
      <h1 className="mt-2 text-2xl font-bold">
        Possible future analysis options
      </h1>
      <ul className="mt-4 flex flex-col gap-3">
        {ANALYSIS_OPTIONS.map((option) => (
          <li
            key={option.title}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {option.icon}
            </svg>
            <div>
              <h2 className="text-[15px] font-bold">{option.title}</h2>
                {option.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopicAnalysis;
