# MetaCensus UI



## Tech stack

- **React 18** + **TypeScript**
- **Vite** — dev server and build tooling
- **TanStack Router** — client-side routing
- **TanStack Query** — server state and data fetching
- **Tailwind CSS** + **Radix UI** — styling and primitives (shadcn-style components in `src/components/ui`)
- **React Hook Form** + **Zod** — forms and validation

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

CI also builds the `metacensus/ui` image and smoke-tests that it serves `/` and SPA deep links; run that only if you changed the Dockerfile or Caddy config.


```bash
npm run dev
```

2. Open a topic that has a consensus statement.
3. Cast a vote with an explanation if the statement has no votes yet (seed does not insert votes).
4. Click **View Votes** and confirm columns left-to-right: **Contributor**, **Position**, **Explanation**.

## Environment variables

See `.env.example` for the full list. Key values:

- `API_PROXY_TARGET` — dev-server-only target for proxying `/metacensus/*`.
  Defaults to `http://localhost:3001`.

## Container images

### `metacensus/ui` — the SPA host

The published `metacensus/ui` image (`Dockerfile`, served by Caddy) is a static host
for the built SPA — it does **not** proxy or route to the API itself.

- **Listens on port `8080`** — e.g. `docker run -p 8080:8080 metacensus/ui`.

### Publishing


## Project structure

```
src/
  components/   UI primitives, shared components, forms, and page partials
  functions/    Small pure helpers
  hooks/        Reusable React hooks
  lib/          API routes, query client, crypto, PDF, and compatibility shims
  router.tsx    TanStack Router route tree
  main.tsx      App entry point
types/          Shared domain TypeScript types
```

