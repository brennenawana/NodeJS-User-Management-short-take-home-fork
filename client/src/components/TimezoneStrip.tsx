import { isLocated, type User } from "../api";
import { firstName } from "../lib/people";
import { relativeShort } from "../lib/relative";
import { localClock, offsetLabel, zoneHint } from "../lib/time";
import { ZoneCell } from "./ZoneCell";
import styles from "./TimezoneStrip.module.css";

interface Props {
  users: User[];
  now: Date;
  /** The viewer's UTC offset in seconds. */
  viewerOffset: number;
  /** The offset the grid is filtered to, if any. */
  active: number | null;
  onPick: (offset: number | null) => void;
}

/**
 * Figma: TimezoneStrip. One ZoneCell per UTC offset, west to east, each saying how far it
 * is from the viewer. When nobody shares the viewer's offset, a "You" cell sits in its place.
 */
export function TimezoneStrip({ users, now, viewerOffset, active, onPick }: Props) {
  const groups = new Map<number, User[]>();
  for (const u of users) if (isLocated(u)) groups.set(u.utcOffsetSeconds, [...(groups.get(u.utcOffsetSeconds) ?? []), u]);
  if (!groups.size) return null;
  const offsets = [...new Set([...groups.keys(), viewerOffset])].sort((a, b) => a - b);
  return (
    <section aria-label="Time zones" className={styles.strip}>
      <div role="group" aria-label="Filter people by UTC offset" className={styles.row}>
        {offsets.map((off) => {
          const members = groups.get(off);
          if (!members) {
            return <ZoneCell key="you" state="you" offset={offsetLabel(off)} hint="You" time={localClock(off, now).text} people="Your time" />;
          }
          const hint = zoneHint(off);
          return (
            <ZoneCell key={off} state={active === off ? "active" : "default"} offset={offsetLabel(off)}
              hint={off === viewerOffset ? (hint ? `You · ${hint}` : "You") : hint}
              time={localClock(off, now).text} relative={relativeShort(off, viewerOffset)}
              people={`${members.length === 1 ? "1 person" : `${members.length} people`} · ${members.map((m) => firstName(m.name)).join(", ")}`}
              onClick={() => onPick(active === off ? null : off)} />
          );
        })}
      </div>
    </section>
  );
}
