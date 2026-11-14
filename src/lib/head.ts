export const SITE_NAME = "MetaCensus";

/** The title of any route that declares none. */
export const DEFAULT_TITLE = `${SITE_NAME}: Evidence becomes consensus`;

/** Kept in step with the static description in `index.html`, which is what crawlers that don't run JS see. */
export const DEFAULT_DESCRIPTION =
  "MetaCensus is neutral infrastructure that turns scientific evidence into living, traceable consensus.";

type PageHead = {
  /** The page's own name. Omit it to get the full site title. */
  title?: string;
  description?: string;
};

/** A route's `head` value: the tab title and the meta description. */
export function pageHead({ title, description }: PageHead = {}) {
  return {
    meta: [
      { title: title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE },
      { name: "description", content: description ?? DEFAULT_DESCRIPTION },
    ],
  };
}
