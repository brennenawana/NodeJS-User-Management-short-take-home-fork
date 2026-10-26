import { CANT_LOCATE_ZIP, located, NOT_A_ZIP, OUTAGE_ZIP, pending } from "./fake-api";

/** The Figma reference time for light screens (design/figma/state.json → referenceTime). */
export const FIGMA_NOW = new Date("2026-10-19T16:50:00Z");

export const team = [
  located("Lena Hoffmann", "02108", "lena"),
  located("Maya Okafor", "10001", "maya"),
  located("Priya Raman", "60601", "priya"),
  located("Grace Whitfield", "80202", "grace"),
  located("Daniel Reyes", "94103", "daniel"),
];

export const noor = pending("Noor Haddad", OUTAGE_ZIP, "noor");
export const noorInvalid = pending("Noor Haddad", NOT_A_ZIP, "noor", "invalidZip");
export const samCantLocate = pending("Sam Castillo", CANT_LOCATE_ZIP, "sam", "cantLocate");

const noop = () => undefined;
export const cardActions = {
  onToggle: noop, onEdit: noop, onCancelEdit: noop, onRemove: noop, onRefresh: noop,
  onSave: async () => undefined,
};
