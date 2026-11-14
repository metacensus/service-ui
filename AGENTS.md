# Working in this repo

## Markdown is never hard-wrapped

One line per paragraph. No manual line breaks, no wrapping at 80 or 100 or any other column — the renderer wraps, and every viewer wraps to its own width.

Hard-wrapped prose makes every edit reflow the paragraph around it, so the diff shows moved words instead of changed ones and review has to read both sides to find the actual change. This applies to `.md` anywhere in the repo, to issue and PR bodies, and to commit message bodies.

Tables, code fences and list structure keep their own line breaks. This is about prose only.

## Marks live in `metacensus/library-ui`

The mark, the wordmark, the arrow and the favicon are the SVGs in `marks/` of [`metacensus/library-ui`](https://github.com/metacensus/library-ui), and their permitted use is its `TRADEMARKS.md`. **This repo uses them; it does not redraw or explain them.**

Import them from `@metacensus/library-ui/marks/*.svg` rather than copying the files. A copy that must stay (an icon format SVG cannot serve) carries the reservation in `public/NOTICE.md`.

## What belongs in a comment here

A comment should say **what the code does** and **what was decided locally**. Three questions, in order:

- **Is it code mechanics?** Keep it. Why a portal is needed, why a constant is kept in sync with a utility class, which CSS combination is impossible — no library doc will ever cover these.
- **Is it a local decision?** Keep it. "Reds mark engineering, blues mark quantitative science" is a mapping this page invented; the brand has no opinion on it.
- **Is it a rule the library already states?** Cut the prose and leave a pointer. If both repos explain a rule, one of them will eventually be wrong and nobody will know which.

**Naming a colour is not explaining it.** `/* Deep Garnet #91042A */` beside `344 95% 29%` earns its place — you cannot read a hex out of an HSL triplet, and the name is the word the brand uses. That is a translation, not a rationale.

## Documentation is current-state only

A README says what is true now. Not what was tried, not what was reversed, not what a previous pass did. Future work goes in an issue and is linked, never described in place.
