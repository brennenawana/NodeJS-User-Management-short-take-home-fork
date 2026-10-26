import { isLocated, type User } from "../api";

// Time is an offset in seconds, never a zone name. Clocks are UTC plus the offset.

const HINTS: Record<number, string> = {
  [-14400]: "Eastern",
  [-18000]: "Central",
  [-21600]: "Mountain",
  [-25200]: "Pacific",
  [-28800]: "Alaska",
  [-36000]: "Hawaii",
};

/** "UTC−4", "UTC+5:30". Uses a real minus sign. */
export function offsetLabel(offsetSeconds: number): string {
  const abs = Math.abs(offsetSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.round((abs % 3600) / 60);
  return `UTC${offsetSeconds < 0 ? "−" : "+"}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** A soft word for familiar US offsets ("Eastern"). The offset stays the source of truth. */
export function zoneHint(offsetSeconds: number): string {
  return HINTS[offsetSeconds] ?? "";
}

export interface LocalClock {
  h: number;
  m: number;
  text: string;
}

export function localClock(offsetSeconds: number, now: Date): LocalClock {
  const d = new Date(now.getTime() + offsetSeconds * 1000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return { h, m, text: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` };
}

export type SkyTime = "morning" | "afternoon" | "evening" | "night";

export function skyTime({ h, m }: Pick<LocalClock, "h" | "m">): SkyTime {
  const t = h + m / 60;
  if (t >= 21 || t < 5) return "night";
  if (t < 12) return "morning";
  if (t < 17) return "afternoon";
  return "evening";
}

export const SKY_LABEL: Record<SkyTime, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

/** "Oct 19", for "Location updated Oct 19". */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PLACE_NOTE = { pending: "location pending", cantLocate: "can’t locate", invalidZip: "zip not found" } as const;

/** "Boston · UTC−4" once located, otherwise the zip and why there's no place yet. */
export function placeLine(user: User): string {
  return isLocated(user) ? `${user.city} · ${offsetLabel(user.utcOffsetSeconds)}` : `${user.zip} · ${PLACE_NOTE[user.locationStatus]}`;
}
