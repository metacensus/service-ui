

};

};

export function shortPaperId(paperId: string): string {
  // "Northfield_2024_100001" -> "Northfield 2024"
  const parts = paperId.split("_");
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return paperId;
}
