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

## Scripts

| Command                  | Description                                         |
| `npm run dev`            | Start the Vite dev server                           |
| `npm run build`          | Build the production bundle to `dist/`              |
| `npm run preview`        | Preview the production build locally                |

## Environment variables

See `.env.example` for the full list. Key values:

- `API_PROXY_TARGET` — dev-server-only target for proxying `/metacensus/*`.
  Defaults to `http://localhost:3001`.

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
