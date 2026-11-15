# MetaCensus UI

The MetaCensus application: log-in, sign-up and everything after them, a single-page React application built with Vite and TanStack Router, served as static assets and published as the **`metacensus/service-ui`** container image. It talks to the MetaCensus API for authentication, topics, papers, protocols, data extraction, and consensus voting.

The SPA host never proxies to an API. Putting the SPA and the API on one origin is the job of whatever reverse proxy fronts them (a load balancer, ingress or local proxy) — which is what lets one image work in every environment.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** — dev server and build tooling
- **TanStack Router** — client-side routing
- **TanStack Query** — server state and data fetching
- **Tailwind CSS** + **Radix UI** — styling and primitives (shadcn-style components in `src/components/ui`)
- **React Hook Form** + **Zod** — forms and validation
- **pdfjs-dist** — PDF viewing and annotation

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment template and adjust as needed:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

The app runs on Vite's default port (http://localhost:5173). The dev server stands
in for the consumer's reverse proxy, so relative paths behave as they do in
production:

- `/metacensus/*` → the MetaCensus API, [service-api-standard](https://github.com/metacensus/service-api-standard) or [service-api-chain](https://github.com/metacensus/service-api-chain) (defaults to `http://localhost:3001`)

## Scripts

| Command                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `npm run dev`            | Start the Vite dev server                           |
| `npm run build`          | Build the production bundle to `dist/`              |
| `npm run preview`        | Preview the production build locally                |
| `npm run tsc`            | Type-check the SPA (`tsc --noEmit`)                 |
| `npm test`               | Run the test suite                                  |

## Testing

There is no linter (`eslint` / `npm run lint`). Before push or PR, run the Node checks that CI runs in `.github/workflows/build.yml`:

```bash
npm run tsc
npm test
npm run build
```

CI also builds the `metacensus/service-ui` image and smoke-tests that it serves `/` and SPA deep links; run that only if you changed the Dockerfile or Caddy config.

For a browser check of the vote list, start an API on `:3001` (for example [service-api-standard](https://github.com/metacensus/service-api-standard), following its README, with seed data), then:

```bash
npm run dev
```

1. Open http://localhost:5173 and sign in (use an account from your API's seed data).
2. Open a topic that has a consensus statement.
3. Cast a vote with an explanation if the statement has no votes yet (seed does not insert votes).
4. Click **View Votes** and confirm columns left-to-right: **Contributor**, **Position**, **Explanation**.

## Environment variables

See `.env.example` for the full list. Key values:

- `API_PROXY_TARGET` — dev-server-only target for proxying `/metacensus/*`.
  Defaults to `http://localhost:3001`.

## Container images

### `metacensus/service-ui` — the SPA host

The published `metacensus/service-ui` image (`Dockerfile`, served by Caddy) is a static host
for the built SPA — it does **not** proxy or route to the API itself.

- **Listens on port `8080`** — e.g. `docker run -p 8080:8080 metacensus/service-ui`.
- **Requires the fronting proxy/ingress to route `/metacensus/*` to the API.** Same-origin routing is the consumer's edge concern (a load balancer, ingress or local proxy) and is deliberately not baked into the image.

### Publishing

`.github/workflows/release.yml` publishes the image multi-arch (`linux/amd64,linux/arm64`) to Docker Hub on `v*` tags, tagged with the git tag, short SHA, and `latest`. `.github/workflows/build.yml` type-checks, tests, and builds and smoke-tests the image on every PR. On every push to `main`, once those pass, it pushes a linux/arm64 image tagged `sha-<short>` and `main` to a private registry repository (not Docker Hub), for environments that track `main`; it signs in through the role in the repository variable `MAIN_IMAGE_ROLE_ARN`. It then restarts the `service-ui` Deployment in staging and waits for the rollout, through the role in `STAGING_ROLLOUT_ROLE_ARN`. Both jobs fail until those variables are set.

## Project structure

```
src/
  app/          Route-level pages, grouped by (marketing), which holds only log-in, sign-up and the 404, and (authenticated)
  components/   UI primitives, shared components, forms, and page partials
  functions/    Small pure helpers
  hooks/        Reusable React hooks
  lib/          API routes, query client, crypto, PDF, and compatibility shims
  router.tsx    TanStack Router route tree
  main.tsx      App entry point
types/          Shared domain TypeScript types
public/         Static assets, app icons, and the PDF.js worker
```

The public pages (home, partner, stewards) are a separate site. This app runs on its own `app.` hostname, so links to them are absolute: `src/lib/publicUrl.ts` derives the origin from the page's hostname (`app.staging.example.test` → `staging.example.test`) and falls back to `https://metacensus.org` anywhere else, which keeps one image for every environment.

The marks are documented in [`@metacensus/library-ui`](https://github.com/metacensus/library-ui), not here. See [AGENTS.md](AGENTS.md) for how to reference them from code.

## License

[AGPL-3.0-only](LICENSE). The marks in `public/` are not covered by it; see [`public/NOTICE.md`](public/NOTICE.md). Contributions: [CONTRIBUTING.md](CONTRIBUTING.md).
