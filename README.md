# User Management

## Getting started

```sh
yarn install
yarn start   # API with nodemon on port 8080
```

## Design

The design lives in Figma and the code follows it.

- **Figma file:** https://www.figma.com/design/Tu8Kz1qqdVWAczefkHzlpE. Its pages are Cover, Getting started, Foundations, Components, Screens and Prototype. Getting started explains the file and how to propose changes.
- **`design/source/`:** the HTML design sources.
- **`design/tokens.css`:** generated from the Figma variables. Every property name equals the variable's code syntax in Figma, so Dev Mode and the code agree. Change the variable in Figma first, then this file in the same change.
- **`design/figma/state.json`:** the ledger of Figma page, component and frame IDs, decisions and lessons.
- **Components match.** React components use the Figma component names, and their props mirror the Figma component properties (`<PersonCard state="pendingLocation">`).
