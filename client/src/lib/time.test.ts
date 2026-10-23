import { describe, expect, test } from "vitest";
import { localClock, offsetLabel, shortDate, skyTime, zoneHint } from "./time";

// Reference times from design/figma/state.json: light screens at UTC 16:50, the dark screen at UTC 01:05.
const LIGHT = new Date("2026-10-19T16:50:00Z");
const DARK = new Date("2026-10-20T01:05:00Z");

describe("offsetLabel", () => {
  test.each([
    [-14400, "UTC−4"],
    [-25200, "UTC−7"],
    [0, "UTC+0"],
    [19800, "UTC+5:30"],
    [-12600, "UTC−3:30"],
    [20700, "UTC+5:45"],
  ])("%i seconds is %s", (offset, label) => expect(offsetLabel(offset)).toBe(label));

  test("uses a real minus sign", () => expect(offsetLabel(-14400)).toContain("−"));
});

describe("localClock", () => {
  test.each([
    [-14400, LIGHT, "12:50 PM", "afternoon"],
    [-18000, LIGHT, "11:50 AM", "morning"],
    [-21600, LIGHT, "10:50 AM", "morning"],
    [-25200, LIGHT, "9:50 AM", "morning"],
    [-14400, DARK, "9:05 PM", "night"],
    [-18000, DARK, "8:05 PM", "evening"],
    [-25200, DARK, "6:05 PM", "evening"],
  ])("offset %i at %s reads %s (%s)", (offset, now, text, sky) => {
    const clock = localClock(offset, now);
    expect(clock.text).toBe(text);
    expect(skyTime(clock)).toBe(sky);
  });

  test("crosses midnight and noon", () => {
    expect(localClock(0, new Date("2026-10-19T00:00:00Z")).text).toBe("12:00 AM");
    expect(localClock(0, new Date("2026-10-19T12:00:00Z")).text).toBe("12:00 PM");
    expect(localClock(-14400, new Date("2026-10-19T02:30:00Z")).text).toBe("10:30 PM");
  });
});

test("sky periods switch at 5, 12, 17 and 21", () => {
  expect(skyTime({ h: 4, m: 59 })).toBe("night");
  expect(skyTime({ h: 5, m: 0 })).toBe("morning");
  expect(skyTime({ h: 12, m: 0 })).toBe("afternoon");
  expect(skyTime({ h: 17, m: 0 })).toBe("evening");
  expect(skyTime({ h: 21, m: 0 })).toBe("night");
});

test("zone hints are soft words for known offsets only", () => {
  expect(zoneHint(-14400)).toBe("Eastern");
  expect(zoneHint(-36000)).toBe("Hawaii");
  expect(zoneHint(3600)).toBe("");
});

test("shortDate", () => expect(shortDate("2026-10-19T16:50:00Z")).toBe("Oct 19"));
