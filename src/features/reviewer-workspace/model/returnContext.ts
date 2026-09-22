

}

export function unitHrefWithOrigin(
  base: string,
  unitId: string,
  origin: ReviewOrigin | null
): string {
  const path = `${base}/units/${encodeURIComponent(unitId)}`;
}

