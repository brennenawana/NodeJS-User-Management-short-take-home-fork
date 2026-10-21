# AGENTS.md

Instructions for coding agents (Claude Code, Codex, Cursor, Copilot, Gemini CLI and others). Tool-specific files only point here.

Read `README.md` first for what the project is and how to run it. This file adds what is specific to agents.

## Commits

- All lowercase, except names from code, which keep their exact case (`MapPin`, `tokens.css`).
- Subject line only, at most 72 characters. Add a body only when it genuinely helps.
- Commit often, in small logical chunks.

Examples: `import starter express app from codesandbox`, `add main screen source with the token definitions`, `log screen fixes, map view, mobile and MapPin in figma state`.

## Agent tooling layout

- `AGENTS.md`: this file, read natively by most agents.
- `CLAUDE.md`: imports this file for Claude Code.
- Integrations (for example a connection to the design tool) and per-tool permission settings are set up by each person in their own agent. They stay out of git.
