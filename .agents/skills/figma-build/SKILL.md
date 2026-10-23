---
name: figma-build
description: Build, update or audit the Figma file (variables, components, screens, prototype) by running Figma Plugin API scripts, and keep design/tokens.css and design/figma/state.json in sync with it. Use when a task changes the Figma file or needs node IDs, tokens or screens from it.
---

# figma-build

Work on the Figma file without rebuilding what is already there and without drifting from the code.

## Setup

- File: https://www.figma.com/design/Tu8Kz1qqdVWAczefkHzlpE (file key `Tu8Kz1qqdVWAczefkHzlpE`). Never create a new file.
- Access: you need a Figma integration that can run Plugin API scripts against the file, screenshot nodes and read variables. Each person configures it in their own agent; it isn't part of this repo.
- If your integration ships its own guidance on writing Plugin API scripts, load it before the first script.

## Read first

1. `design/figma/state.json`: page, collection, component and property IDs, decisions (Nunito styles, CSS naming, avatar hues, clock reference times) and lessons. Trust it, but verify against the file.
2. `scripts/helpers.js` in this skill: the preamble pasted at the top of every script that changes the file. It loads variables, styles and fonts and gives you `fill`, `stroke`, `radius`, `pad`, `gap`, `box`, `text`, `spacer`, `nested`, `setP` and friends. Nothing persists between scripts, so paste it every time.
3. `design/source/`: the source of truth. `R2-Main.dc.html` holds `function tokens(...)` and the screen layouts. `R2-States`, `R2-Mobile` and `R2-Sky` hold the variants, the phone layout and the sky art.

## Workflow

1. Inventory first: one read-only script that lists pages, variable collections with counts, styles, component sets and top-level frames. Compare it with `state.json`.
2. Make changes in retry-safe batches, one page per script, and never run two scripts at the same time.
3. Return every created or changed node ID, and record the stable ones in `state.json`.
4. Take one screenshot per finished page. Fix clipped, overlapping or low-contrast text before moving on.
5. If variables or text styles changed, re-export them to `design/tokens.json` (same shape: collections with each variable's code syntax and per-mode values, aliases as `{ alias, codeSyntax }`, then text styles) and update `design/tokens.css` to match. `yarn check:tokens` fails until the two agree.
6. Commit `state.json`, `tokens.css` and any helper changes, following the commit rules in `AGENTS.md`.

## Rules

- Build screens from component instances. Override text through component properties and never detach.
- Bind fills, strokes, gaps, padding and radii to variables. Dark screens set the Color collection's Dark mode on the frame.
- Labels are city plus UTC offset ("Boston · UTC−4"), never states or IANA zone names.
- Remove temporary nodes before finishing.
- If a script fails partway, read the canvas before running it again. Don't retry the same failing approach more than twice: change approach.

## Gotchas learned on this file

- Empty auto-layout frames used as spacers default to 100px tall. Use `spacer()` (FILL width, FIXED 1px height).
- Frames from `createAutoLayout` clip content, which cuts card shadows. `box()` turns clipping off; do the same for any transparent wrapper.
- On a fresh clone, main-component lookups miss nested instances. Address them by path ID with `nested(instance, childId)`. For example, the ViewToggle inside AppHeader is `nested(header, '10:186')`.
- `minWidth` can't be overridden on an instance. Set it on the component and override only the sizing on the instance.
- A FILL child in a wrapping row has a min width of 0 and stays on the first line. Give it a min width so it wraps before filling.
- A cell with an explicit Dark mode inside a light frame needs its own `surface` fill, or `ink` text renders light on light.
- For vector art, import SVG with sentinel colours, then rebind each paint to a variable by matching colour.
- Reactions can be set directly on nested instance layers; hotspot rectangles aren't needed.
- `setFileThumbnailNodeAsync` isn't available to scripts. Figma falls back to the first frame on the first page (the Cover).
