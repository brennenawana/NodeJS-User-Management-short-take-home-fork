// Projection for the stylised contiguous-US map in design/source/R2-Main.dc.html.
// It is a plain equirectangular box: lon −125…−66, lat 23.4…50. Anything outside
// (Alaska, Hawaii) is pinned to the nearest edge.

const WEST = -125, SPAN_LON = 59, NORTH = 50, SPAN_LAT = 26.6;
const clamp = (v: number) => Math.max(2, Math.min(98, v));

/** Position as a percentage of the map's width and height. */
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: clamp(((lon - WEST) / SPAN_LON) * 100), y: clamp(((NORTH - lat) / SPAN_LAT) * 100) };
}

export type PinSide = "right" | "top" | "bottom";

export interface Point { id: string; lat: number; lon: number }

/** Labels go to the right, unless a neighbour is close; then the northern pin labels above and the southern one below. */
export function pinSide(point: Point, all: Point[]): PinSide {
  const near = all.find((o) => o.id !== point.id && Math.abs(o.lon - point.lon) < 4.8 && Math.abs(o.lat - point.lat) < 3);
  if (!near) return "right";
  return point.lat > near.lat ? "top" : "bottom";
}

// Offset bands as drawn: x ranges in the 590-wide viewBox.
export const BANDS = [
  { label: "UTC−7", x: 0, w: 110, shaded: true },
  { label: "UTC−6", x: 110, w: 120, shaded: false },
  { label: "UTC−5", x: 230, w: 160, shaded: true },
  { label: "UTC−4", x: 390, w: 200, shaded: false },
];
