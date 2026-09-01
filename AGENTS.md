# Working in this repo

## Markdown is never hard-wrapped

One line per paragraph. No manual line breaks, no wrapping at 80 or 100 or any other column — the renderer wraps, and every viewer wraps to its own width.

Hard-wrapped prose makes every edit reflow the paragraph around it, so the diff shows moved words instead of changed ones and review has to read both sides to find the actual change. This applies to `.md` anywhere in the repo, to issue and PR bodies, and to commit message bodies.

Tables, code fences and list structure keep their own line breaks. This is about prose only.




## What belongs in a comment here

A comment should say **what the code does** and **what was decided locally**. Three questions, in order:



## Documentation is current-state only

A README says what is true now. Not what was tried, not what was reversed, not what a previous pass did. Future work goes in an issue and is linked, never described in place.
