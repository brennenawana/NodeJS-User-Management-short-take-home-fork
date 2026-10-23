import { isLocated, type User } from "../api";
import { firstName } from "../lib/people";
import { localClock, offsetLabel, zoneHint } from "../lib/time";
import { ZoneCell } from "./ZoneCell";

interface Props {
  users: User[];
  now: Date;
  /** The offset the grid is filtered to, if any. */
  active: number | null;
  onPick: (offset: number | null) => void;
}

/** Figma: TimezoneStrip. One ZoneCell per UTC offset, west to east. */
export function TimezoneStrip({ users, now, active, onPick }: Props) {
  const groups = new Map<number, User[]>();
  for (const u of users) if (isLocated(u)) groups.set(u.utcOffsetSeconds, [...(groups.get(u.utcOffsetSeconds) ?? []), u]);
  const offsets = [...groups.keys()].sort((a, b) => a - b);
  if (!offsets.length) return null;
  return (
    <section aria-label="Time zones" style={{ marginBottom: "var(--space-24)" }}>
      <div role="group" aria-label="Filter people by UTC offset"
        style={{ display: "flex", gap: "var(--space-12)", overflowX: "auto", paddingBottom: "var(--space-4)" }}>
        {offsets.map((off) => {
          const members = groups.get(off)!;
          return (
            <ZoneCell key={off} state={active === off ? "active" : "default"} offset={offsetLabel(off)} hint={zoneHint(off)}
              time={localClock(off, now).text}
              people={`${members.length === 1 ? "1 person" : `${members.length} people`} · ${members.map((m) => firstName(m.name)).join(", ")}`}
              onClick={() => onPick(active === off ? null : off)} />
          );
        })}
      </div>
    </section>
  );
}
