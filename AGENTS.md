# AGENTS.md

Instructions for coding agents (Claude Code, Codex, Cursor, Copilot, Gemini CLI and others). Tool-specific files only point here.

Read `README.md` first. It covers what the project is, how to run it, how the code is laid out and the design workflow, and all of it applies to you. This file adds what is specific to agents.

## Working rules

- Follow the layout in the README. Never let a vendor client, URL or response shape leak into `server/src/core/`; a new service gets a port there and an implementation in its own folder, and `server/src/compose.ts` stays the only place that picks one.
- Style with the tokens in `design/tokens.css` only, and name components and props after the Figma file.
- Ship tests with every change and run `yarn test` (plus `yarn e2e` for UI flows) before committing.
- Keep the README's commands current when scripts change.
- Never commit secrets.
- When the code and the Figma file disagree, flag it instead of guessing.

## Commits

- All lowercase, except names from code, which keep their exact case (`MapPin`, `tokens.css`).
- Subject line only, at most 72 characters. Add a body only when it genuinely helps.
- Commit often, in small logical chunks.

Examples: `import starter express app from codesandbox`, `add main screen source with the token definitions`, `log screen fixes, map view, mobile and MapPin in figma state`.

## Agent tooling layout

- `AGENTS.md`: this file, read natively by most agents.
- `CLAUDE.md`: imports this file for Claude Code.
- `.agents/skills/<name>/SKILL.md`: reusable workflows in the open Agent Skills format. Each skill says when to use it. `.claude/skills` is a symlink to this folder so Claude Code finds the same skills.
- Integrations (for example a connection to the design tool) and per-tool permission settings are set up by each person in their own agent. They stay out of git.
