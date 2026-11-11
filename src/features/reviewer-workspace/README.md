# Reviewer Workspace Feature

Topic-scoped Comparanda extraction review lives here. UI code consumes a static snapshot through `data/snapshot.ts` and persists demo review events through the replaceable adapter in `data/persistence.ts`.

The presentation sequence is Schema, Data, then Review. Snapshot-level `demo_config.json` may feature papers and review units, but components must retain generic ordering when that optional file is absent.


