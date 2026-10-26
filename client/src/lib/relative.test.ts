import { expect, test } from "vitest";
import { relativeLabel, relativeShort, secondsAhead, viewerOffsetSeconds } from "./relative";

const NY = -14400, DENVER = -21600, SF = -25200, INDIA = 19800, NEPAL = 20700;

test("labels say how far ahead or behind someone is", () => {
  expect(relativeLabel(NY, SF)).toBe("3h ahead of you");
  expect(relativeLabel(SF, NY)).toBe("3h behind you");
  expect(relativeLabel(DENVER, DENVER)).toBe("Same time as you");
  expect(relativeLabel(INDIA, NY)).toBe("9h 30m ahead of you");
  expect(relativeLabel(NEPAL, INDIA)).toBe("15m ahead of you");
});

test("short labels use signs, with a real minus", () => {
  expect(relativeShort(NY, SF)).toBe("+3h");
  expect(relativeShort(SF, NY)).toBe("−3h");
  expect(relativeShort(NY, NY)).toBe("±0");
  expect(relativeShort(INDIA, NY)).toBe("+9h 30m");
});

test("secondsAhead is the signed difference", () => {
  expect(secondsAhead(NY, SF)).toBe(10800);
  expect(secondsAhead(SF, NY)).toBe(-10800);
});

test("the viewer's offset comes from the browser, sign flipped from getTimezoneOffset", () => {
  const fake = { getTimezoneOffset: () => 240 } as Date; // UTC−4 reports +240 minutes
  expect(viewerOffsetSeconds(fake)).toBe(-14400);
});
