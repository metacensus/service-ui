import {
  readReviewSessionFlag,
  writeReviewSessionFlag,
  type ReviewSessionFlag,
} from "../model/reviewSession";

const sessionStore = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

