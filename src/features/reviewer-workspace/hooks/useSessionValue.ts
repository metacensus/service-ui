"use client";

import { useState } from "react";
import {
  readReviewSessionFlag,
  writeReviewSessionFlag,
  type ReviewSessionFlag,
} from "../model/reviewSession";

const sessionStore = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

export function useSessionValue<T>(
  read: (storage: Storage | null) => T,
  write: (storage: Storage | null, value: T) => void
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => read(sessionStore()));
  const update = (next: T) => {
    setValue(next);
    write(sessionStore(), next);
  };
  return [value, update];
}

export const useReviewSessionFlag = (flag: ReviewSessionFlag) =>
  useSessionValue(
    (storage) => readReviewSessionFlag(storage, flag),
    (storage, value) => writeReviewSessionFlag(storage, flag, value)
  );
