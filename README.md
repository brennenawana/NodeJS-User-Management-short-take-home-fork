# User Management

## Getting started

```sh
yarn install
yarn start   # API with nodemon on port 8080
```

## Server

A TypeScript Express API in `server/`.

- `server/src/core/`: the user record, the users service and the ports it depends on (`LocationProvider`, `UsersRepo`, `Clock`). Nothing in here knows about HTTP, files or any vendor.
- `server/src/storage/<name>/`: `UsersRepo` implementations (`memory`, `json-file`). Each one passes `storage/repo-contract.ts`.
- `server/src/http/`: routes, request validation and error responses.
- `server/src/app.ts`: `buildApp({ repo, locationProvider, clock })` wires it together.
- `product.json`: the product name. Code imports it, and a test fails if the README title or a package name drifts from it.

A user is `id, name, zip, city, lat, lon, utcOffsetSeconds, locationUpdatedAt`. A timezone is a UTC offset in seconds, captured when the location was looked up. If the lookup fails, the user is still saved with the location fields set to `null` until a refresh succeeds. Editing only looks the zip up again when it changes.

| Method | Path | |
|---|---|---|
| `GET` | `/api/users` | everyone, sorted by name |
| `POST` | `/api/users` | `{ name, zip }` |
| `GET` `PATCH` `DELETE` | `/api/users/:id` | `PATCH` takes `{ name?, zip? }` |
| `POST` | `/api/users/:id/refresh-location` | look the current zip up again |
| `GET` | `/api/zip/:zip` | preview a lookup without saving |

Errors come back as `{ error: { code, message, field? } }`, and the messages are written for people.

## Tests

```sh
yarn test        # server: node:test
yarn typecheck
```

## Design

The design lives in Figma and the code follows it.

- **Figma file:** https://www.figma.com/design/Tu8Kz1qqdVWAczefkHzlpE. Its pages are Cover, Getting started, Foundations, Components, Screens and Prototype. Getting started explains the file and how to propose changes.
- **`design/source/`:** the HTML design sources.
- **`design/tokens.css`:** generated from the Figma variables. Every property name equals the variable's code syntax in Figma, so Dev Mode and the code agree. Change the variable in Figma first, then this file in the same change.
- **`design/figma/state.json`:** the ledger of Figma page, component and frame IDs, decisions and lessons.
- **Components match.** React components use the Figma component names, and their props mirror the Figma component properties (`<PersonCard state="pendingLocation">`).
