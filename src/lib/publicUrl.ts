// The public pages (home, partner, stewards) are served by the public site on
// the environment's apex host; this app runs on that host's `app.` subdomain.
// Links to them must be absolute because the two are different origins.
//
// Derived from the page's own hostname rather than a build-time variable, so one
// image still serves every environment: `app.staging.example.test` links to
// `staging.example.test`, `app.metacensus.org` to `metacensus.org`. Any other
// host (localhost, a preview URL) falls back to production.
export const PRODUCTION_PUBLIC_ORIGIN = "https://metacensus.org";

const APP_HOST_PREFIX = "app.";

type Where = Pick<Location, "protocol" | "hostname" | "port">;

// Without a `window` (server rendering in tests) there is no hostname to read.
export function publicOrigin(
  location: Where | undefined = typeof window === "undefined" ? undefined : window.location
): string {
  if (!location) return PRODUCTION_PUBLIC_ORIGIN;
  const { protocol, hostname, port } = location;
  if (!hostname.startsWith(APP_HOST_PREFIX)) return PRODUCTION_PUBLIC_ORIGIN;
  const host = hostname.slice(APP_HOST_PREFIX.length);
  return `${protocol}//${host}${port ? `:${port}` : ""}`;
}

export function publicUrl(path = "/", location?: Where): string {
  return publicOrigin(location) + path;
}
