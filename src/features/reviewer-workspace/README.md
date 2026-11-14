# Reviewer Workspace Feature

Topic-scoped Comparanda extraction review lives here. UI code consumes a static snapshot through `data/snapshot.ts` and persists demo review events through the replaceable adapter in `data/persistence.ts`.

The presentation sequence is Schema, Data, then Review. Snapshot-level `demo_config.json` may feature papers and review units, but components must retain generic ordering when that optional file is absent.

The run data is served by whatever hosts the export under `/reviewer-snapshots/`; locally it appears in the ignored `public/reviewer-snapshots/` directory. Do not statically import snapshot data or commit PDF assets to the UI repository.

The export-backed tests read the run from a local server at `DEMO_BASE_URL` (default `http://localhost:5173`) and skip only when it is unreachable.
