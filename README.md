# User Management

A small app for a distributed team: a card for each person with their local time, and a strip that groups everyone by UTC offset. Adding someone takes a name and a US zip code; the city, coordinates and offset are looked up for you.

## Getting started

```sh
yarn install
cp .env.example .env   # optional: the defaults run offline
yarn seed              # optional: adds the sample team
yarn dev               # API on :8080 and the app on http://localhost:5173
```

| Script | |
|---|---|
| `yarn dev` | API and client with reload; Vite proxies `/api` to the API |
| `yarn start` | API only |
| `yarn build` | production build of the client into `client/dist` |
| `yarn seed` | adds the eight sample people through the configured provider |
| `yarn test` | server and client suites |
| `yarn typecheck` | both workspaces |

## Server

A TypeScript Express API in `server/`.

- `server/src/core/`: the user record, the users service and the ports it depends on (`LocationProvider`, `UsersRepo`, `Clock`). Nothing in here knows about HTTP, files or any vendor.
- `server/src/storage/<name>/`: `UsersRepo` implementations (`memory`, `json-file`). Each one passes `storage/repo-contract.ts`.
- `server/src/http/`: routes, request validation and error responses.
- `server/src/providers/location/<name>/`: `LocationProvider` implementations, listed in `providers/location/index.ts`.
- `server/src/app.ts`: `buildApp({ repo, locationProvider, clock })` wires it together.
- `server/src/main.ts`: reads `.env` through `config.ts` and picks the concrete storage and provider. It's the only file that does.
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

## Client

A Vite, React and TypeScript app in `client/`.

- `client/src/components/`: one file per Figma component (`AppHeader`, `TimezoneStrip`, `ZoneCell`, `PersonCard`, `AddSheet`, `Avatar`, `SkyChip`, `Button`, `TextField`, `ViewToggle`, `Toast`, `EmptyState`). Props mirror the Figma properties, so `<PersonCard state="pendingLocation">` is the PersonCard / PendingLocation variant.
- Styles use only the tokens in `design/tokens.css`: light in `:root`, dark in `[data-theme="dark"]`, type as `font: var(--text-md-semibold)`.
- `client/src/lib/time.ts`: clocks are UTC plus the stored offset, and labels read "Boston · UTC−4".
- `client/src/api.ts`: the only place that talks to the server.
- The header wordmark and the page title come from `product.json`.

The map view isn't built yet; the toggle says so.

## Location providers

`LOCATION_PROVIDER` picks how a zip becomes a city, coordinates and a UTC offset.

| Name | Needs | Notes |
|---|---|---|
| `fixture` (default) | nothing | Offline table of sample zips. `00001` simulates an outage. |
| `openweathermap` | `OPENWEATHER_API_KEY` | One call to the current weather API; uses `name`, `coord` and `timezone`. |
| `google` | `GOOGLE_MAPS_API_KEY` | Geocoding API, then the Time Zone API at the current time; the offset is `rawOffset + dstOffset`. |

Each provider validates what it gets back and reports failures as one of two errors: `ZipNotFound` or `ProviderUnavailable`. Every provider runs `providers/location/conformance.ts`. Adapter tests run against saved responses in `fixtures/`: real captures for OpenWeatherMap (`node scripts/probe-openweathermap.mjs` refreshes them), and hand-written ones for Google (see `fixtures/google/README.md`).

To add a provider, create `server/src/providers/location/<name>/index.ts` exporting `fromEnv(env)`, add it to `providers/location/index.ts`, run the conformance suite against it, and list its variables in `.env.example`.

`STORAGE` picks `json-file` (default, `DATA_FILE`) or `memory`.

## Tests

```sh
yarn test           # token drift check, server (node:test) and client (Vitest, Testing Library, MSW)
yarn typecheck
yarn e2e            # Playwright: add, edit and remove against the real API and a production build
yarn workspace user-management-server test:live   # hits the real providers whose keys are in .env
```

The e2e run starts its own API with the `fixture` provider and in-memory storage, so it needs no key and leaves `data/` alone. Run `yarn workspace user-management-e2e playwright install chromium` once first.

CI (`.github/workflows/ci.yml`) runs the typecheck, the token drift check, both unit suites, the client build and the e2e test on every push and pull request.

## Design

The design lives in Figma and the code follows it.

- **Figma file:** https://www.figma.com/design/Tu8Kz1qqdVWAczefkHzlpE. Its pages are Cover, Getting started, Foundations, Components, Screens and Prototype. Getting started explains the file and how to propose changes.
- **`design/source/`:** the HTML design sources.
- **`design/tokens.css`:** generated from the Figma variables. Every property name equals the variable's code syntax in Figma, so Dev Mode and the code agree. Change the variable in Figma first, then this file in the same change.
- **`design/tokens.json`:** the Figma variables and text styles as exported. `yarn check:tokens` fails if `tokens.css` disagrees with it, or if the Product collection disagrees with `product.json`.
- **`design/figma/state.json`:** the ledger of Figma page, component and frame IDs, decisions and lessons.
- **Components match.** React components use the Figma component names, and their props mirror the Figma component properties (`<PersonCard state="pendingLocation">`).
