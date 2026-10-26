import { isLocated, needsAttention, type UnlocatedStatus, type User } from "../api";
import { relativeLabel } from "../lib/relative";
import { localClock, offsetLabel, SKY_LABEL, skyTime } from "../lib/time";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import styles from "./PersonTable.module.css";

// The same words PersonCard puts on its place line for someone without a location.
const PLACE_NOTE: Record<UnlocatedStatus, string> = { pending: "location pending", cantLocate: "can’t locate", invalidZip: "zip not found" };

const STATUS: Record<UnlocatedStatus, { text: string; icon: IconName; tone: "notice" | "error" }> = {
  pending: { text: "Location pending", icon: "clock", tone: "notice" },
  cantLocate: { text: "Can’t locate", icon: "warning", tone: "notice" },
  invalidZip: { text: "Zip not found", icon: "alert", tone: "error" },
};

interface Props {
  users: User[];
  now: Date;
  /** The viewer's UTC offset in seconds, for the Relative column. */
  viewerOffset: number;
  onEdit: (id: string) => void;
  onRemove: (user: User) => void;
}

/**
 * Figma: PersonTable. A condensed, scannable list of people. Rows are the Figma "State"
 * variant: Flagged for a zip problem, Default otherwise. Below 640px each row stacks
 * into a compact block with CSS alone, so the markup stays a real table.
 */
export function PersonTable({ users, now, viewerOffset, onEdit, onRemove }: Props) {
  return (
    <div className={styles.panel}>
      {/* Explicit roles: some browsers drop table semantics once rows are display: grid. */}
      <table className={styles.table} role="table">
        <caption className={styles.srOnly}>People</caption>
        <thead className={styles.head} role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Person</th>
            <th scope="col" role="columnheader">Local time</th>
            <th scope="col" role="columnheader">Relative</th>
            <th scope="col" role="columnheader" className={styles.zip}>Zip</th>
            <th scope="col" role="columnheader"><span className={styles.srOnly}>Actions</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {users.map((user) => <Row key={user.id} user={user} now={now} viewerOffset={viewerOffset} onEdit={onEdit} onRemove={onRemove} />)}
        </tbody>
      </table>
    </div>
  );
}

function Row({ user, now, viewerOffset, onEdit, onRemove }: Omit<Props, "users"> & { user: User }) {
  const located = isLocated(user);
  const place = located ? `${user.city} · ${offsetLabel(user.utcOffsetSeconds)}` : `${user.zip} · ${PLACE_NOTE[user.locationStatus]}`;
  const clock = located ? localClock(user.utcOffsetSeconds, now) : null;
  const status = located ? null : STATUS[user.locationStatus];

  return (
    <tr className={styles.row} role="row" data-state={needsAttention(user) ? "flagged" : "default"}>
      <th scope="row" role="rowheader" className={styles.person}>
        <span className={styles.who}>
          <Avatar name={user.name} size="sm" />
          <span className={styles.names}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.place}>{place}</span>
          </span>
        </span>
      </th>
      <td role="cell" className={styles.time}>
        {clock ? (
          <>
            <span className={styles.clock}>{clock.text}</span>
            <span className={styles.period}>{SKY_LABEL[skyTime(clock)]}</span>
          </>
        ) : (
          <><span aria-hidden="true">—</span><span className={styles.srOnly}>Unknown</span></>
        )}
      </td>
      <td role="cell" className={styles.relative}>
        {status ? (
          <span className={`${styles.status} ${styles[status.tone]}`}><Icon name={status.icon} size={16} />{status.text}</span>
        ) : located ? relativeLabel(user.utcOffsetSeconds, viewerOffset) : null}
      </td>
      <td role="cell" className={styles.zip}>{user.zip}</td>
      <td role="cell" className={styles.actions}>
        <Button variant="ghost" icon="edit" aria-label={`Edit ${user.name}`} onClick={() => onEdit(user.id)} />
        <Button variant="ghost" icon="trash" className={styles.remove} aria-label={`Remove ${user.name}`} onClick={() => onRemove(user)} />
      </td>
    </tr>
  );
}
