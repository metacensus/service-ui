// The sign-up country picker. Two sources, neither hand-maintained: the code
// list comes from `countries-list`, the display names from `Intl.DisplayNames`.
//
// We store the alpha-2 code and never the name. Matching on a name makes one
// exact spelling the only valid input — the old `data/countries.ts` carried the
// ISO official forms, so "Bahamas (the)" validated and "Bahamas" did not. Codes
// have no spelling. Names are also the part of ISO 3166 that actually churns
// ("Turkey" → "Türkiye", "Swaziland" → "Eswatini"); handing them to the browser
// keeps them current and localises them for free.
//
// The wire value matches what the backend's own API docs describe
// (`"country": "US"`), which the full-name form did not.
import alpha2ToAlpha3 from "countries-list/minimal/countries.2to3.min.json";

// `countries-list` ships AC (Ascension Island) and TA (Tristan da Cunha), which
// ISO 3166-1 exceptionally reserves rather than assigns; neither is somewhere
// you register from. Dropping them leaves the 249 officially assigned codes
// plus XK, the user-assigned code for Kosovo that the EU and IMF use and that
// `i18n-iso-countries` also carries — 250 in total.
const EXCEPTIONALLY_RESERVED = ["AC", "TA"];

export const countryCodes: readonly string[] = Object.freeze(
  Object.keys(alpha2ToAlpha3).filter(
    (code) => !EXCEPTIONALLY_RESERVED.includes(code)
  )
);

const countryCodeSet = new Set(countryCodes);

export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && countryCodeSet.has(value);
}

// `Intl.DisplayNames` construction is not cheap and `countryOptions` needs 250
// lookups, so instances are cached per locale.
const displayNamesByLocale = new Map<string, Intl.DisplayNames>();

function displayNamesFor(locale: string): Intl.DisplayNames {
  let displayNames = displayNamesByLocale.get(locale);
  if (!displayNames) {
    // `fallback: "code"` returns the code itself for anything ICU does not
    // know, so an unrecognised entry degrades to "ZZ" rather than the localised
    // "Unknown Region".
    displayNames = new Intl.DisplayNames([locale], {
      type: "region",
      fallback: "code",
    });
    displayNamesByLocale.set(locale, displayNames);
  }
  return displayNames;
}

export function countryName(code: string, locale = "en"): string {
  return displayNamesFor(locale).of(code) ?? code;
}

// Sorted by display name, so the order follows whatever the names resolve to
// rather than the alphabetical accident of the codes.
export function countryOptions(
  locale = "en"
): { code: string; name: string }[] {
  const collator = new Intl.Collator(locale);
  return countryCodes
    .map((code) => ({ code, name: countryName(code, locale) }))
    .sort((a, b) => collator.compare(a.name, b.name));
}
