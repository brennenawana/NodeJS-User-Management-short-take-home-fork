import { expect, test } from "vitest";
import { pinSide, project } from "./map";

test("projects the sample cities inside the map", () => {
  const boston = project(42.3576, -71.0684);
  expect(boston.x).toBeCloseTo(91.4, 0);
  expect(boston.y).toBeCloseTo(28.8, 0);
  const sf = project(37.7725, -122.4147);
  expect(sf.x).toBeLessThan(10);
});

test("clamps places outside the contiguous US to the edge", () => {
  expect(project(21.3, -157.9)).toEqual({ x: 2, y: 98 });
  expect(project(61.2, -149.9)).toEqual({ x: 2, y: 2 });
});

test("labels move above and below when two pins crowd", () => {
  const boston = { id: "b", lat: 42.36, lon: -71.06 };
  const nyc = { id: "n", lat: 40.75, lon: -74.0 };
  const denver = { id: "d", lat: 39.75, lon: -105.0 };
  const all = [boston, nyc, denver];
  expect(pinSide(boston, all)).toBe("top");
  expect(pinSide(nyc, all)).toBe("bottom");
  expect(pinSide(denver, all)).toBe("right");
});
