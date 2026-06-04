// Minimal compatibility shim for the `useQueryState` hook from `nuqs`, backed
// by TanStack Router's location + native URLSearchParams. Only the string
// variant with `{ defaultValue, clearOnDefault }` is supported, which is all
// the UI uses.

import { useCallback } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

type Options = {
  defaultValue?: string;
  clearOnDefault?: boolean;
};

type Setter = (
  value: string | ((old: string) => string)
) => void;

export function useQueryState(
  key: string,
  options: Options = {}
): [string, Setter] {
  const { defaultValue = "", clearOnDefault = true } = options;
  const navigate = useNavigate();
  const searchStr = useLocation().searchStr;

  const params = new URLSearchParams(searchStr ?? "");
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback<Setter>(
    (next) => {
      const current = new URLSearchParams(
        window.location.search ?? ""
      );
      const resolved =
        typeof next === "function"
          ? next(current.get(key) ?? defaultValue)
          : next;

      if (clearOnDefault && (resolved === defaultValue || resolved === "")) {
        current.delete(key);
      } else {
        current.set(key, resolved);
      }

      const searchObj: Record<string, string> = {};
      current.forEach((v, k) => {
        searchObj[k] = v;
      });

      navigate({ to: ".", search: searchObj, replace: true });
    },
    [key, defaultValue, clearOnDefault, navigate]
  );

  return [value, setValue];
}
