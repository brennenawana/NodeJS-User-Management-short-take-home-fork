import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { ApiError, isLocated, type User } from "../api";
import { useZipLookup } from "../hooks/useZipLookup";
import { localClock, offsetLabel, shortDate, SKY_LABEL, skyTime, zoneHint } from "../lib/time";
import { checkZipInput } from "../lib/zip";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { SkyChip } from "./SkyChip";
import { TextField } from "./TextField";
import styles from "./PersonCard.module.css";

export type PersonCardState = "default" | "expanded" | "editing" | "pendingLocation" | "skeleton";

export interface PersonCardActions {
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: { name?: string; zip?: string }) => Promise<unknown>;
  onRemove: () => void;
  onRefresh: () => void;
}

type Props =
  | { state: "skeleton" }
  | ({ state: Exclude<PersonCardState, "skeleton">; user: User; now: Date; index?: number } & PersonCardActions);

/**
 * Figma: PersonCard. `state` is the Figma "State" variant. A pending location
 * can also be expanded or edited, so those states still show the pending banner.
 */
export function PersonCard(props: Props) {
  if (props.state === "skeleton") return <SkeletonCard />;
  return <Card {...props} />;
}

function SkeletonCard() {
  return (
    <li className={`${styles.card} ${styles.skeleton}`} aria-hidden="true" data-state="skeleton">
      <div className={styles.head}>
        <span className={styles.bar} style={{ width: 48, height: 48, borderRadius: "var(--radius-full)" }} />
        <span style={{ flex: 1, display: "grid", gap: "var(--space-8)" }}>
          <span className={styles.bar} style={{ width: "60%", height: 14 }} />
          <span className={styles.bar} style={{ width: "40%", height: 12 }} />
        </span>
      </div>
      <div className={styles.clockRow}>
        <span className={styles.bar} style={{ width: 120, height: 28 }} />
        <span className={styles.bar} style={{ width: 72, height: 36, borderRadius: "var(--radius-md)" }} />
      </div>
    </li>
  );
}

function Card({ state, user, now, index = 0, onToggle, onEdit, onCancelEdit, onSave, onRemove, onRefresh }: Extract<Props, { user: User }>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const expanded = state === "expanded" || state === "editing";
  const located = isLocated(user);
  const hint = located ? zoneHint(user.utcOffsetSeconds) : "";
  const place = located ? `${user.city} · ${offsetLabel(user.utcOffsetSeconds)}` : `${user.zip} · location pending`;
  const clock = located ? localClock(user.utcOffsetSeconds, now) : null;
  const sky = clock ? skyTime(clock) : null;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <li id={`person-${user.id}`} className={`${styles.card} ${expanded ? styles.expanded : ""}`} data-state={state}
      style={{ "--enter-index": Math.min(index, 8) } as CSSProperties}>
      <div className={styles.head}>
        <button type="button" className={styles.identity} aria-expanded={expanded} onClick={onToggle}>
          <Avatar name={user.name} />
          <span className={styles.names}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.place}>{place}</span>
          </span>
        </button>
        <Button variant="ghost" icon="more" aria-label={`More actions for ${user.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
      </div>

      {menuOpen && (
        <div role="menu" aria-label={`Actions for ${user.name}`} className={styles.menu}>
          <Button variant="secondary" role="menuitem" icon="edit" label="Edit details" onClick={() => { setMenuOpen(false); onEdit(); }} />
          <Button variant="danger" role="menuitem" icon="trash" label="Remove" onClick={() => { setMenuOpen(false); onRemove(); }} />
        </div>
      )}

      {clock && sky && (
        <div className={styles.clockRow}>
          <div>
            <p className={styles.time}>{clock.text}</p>
            <p className={styles.period}>{SKY_LABEL[sky]}{hint && ` · ${hint}`}</p>
          </div>
          <SkyChip time={sky} label={`${SKY_LABEL[sky]} in ${user.city}`} />
        </div>
      )}

      {!located && (
        <div className={styles.pending}>
          <Icon name="clock" size={16} />
          <span>Location pending. We will retry the lookup.</span>
          <Button variant="ghost" label="Try now" onClick={onRefresh} />
        </div>
      )}

      {expanded && (
        <div className={styles.detail}>
          <dl className={styles.facts}>
            <div><dt>Location</dt><dd>{place} {hint && <span className={styles.soft}>({hint})</span>}</dd></div>
            <div><dt>Coordinates</dt><dd>{located ? `${user.lat.toFixed(4)}, ${user.lon.toFixed(4)}` : "Not located yet"}</dd></div>
            <div><dt>Zip</dt><dd>{user.zip}</dd></div>
            <div><dt>Record</dt><dd title={user.id}>#{user.id.slice(0, 8)}</dd></div>
          </dl>
          <div className={styles.side}>
            {state !== "editing" && (
              <div className={styles.actions}>
                <Button variant="secondary" icon="edit" label="Edit" onClick={onEdit} />
                <Button variant="danger" icon="trash" label="Remove" onClick={onRemove} />
                <Button variant="secondary" icon="chevron-up" aria-label={`Collapse ${user.name}`} onClick={onToggle} />
              </div>
            )}
            {located && (
              <p className={styles.updated}>
                <span>Location updated {shortDate(user.locationUpdatedAt)}</span>
                <span aria-hidden="true">·</span>
                <Button variant="ghost" label="Refresh location" onClick={onRefresh} />
              </p>
            )}
          </div>
        </div>
      )}

      {state === "editing" && <EditForm user={user} onSave={onSave} onCancel={onCancelEdit} />}
    </li>
  );
}

function EditForm({ user, onSave, onCancel }: { user: User; onSave: PersonCardActions["onSave"]; onCancel: () => void }) {
  const [name, setName] = useState(user.name);
  const [zip, setZip] = useState(user.zip);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const zipChanged = zip !== user.zip;
  const lookup = useZipLookup(zip, zipChanged);
  const zipInput = checkZipInput(zip);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError({ field: "name", message: "Add a name so people know who this is." });
    if (zipInput.kind !== "complete") return setError({ field: "zip", message: zipInput.text });
    setSaving(true);
    try {
      await onSave({ ...(name.trim() !== user.name && { name: name.trim() }), ...(zipChanged && { zip }) });
    } catch (err) {
      setError(err instanceof ApiError ? { field: err.field, message: err.message } : { message: "Something went wrong. Please try again." });
      setSaving(false);
    }
  }

  const ahead = lookup.status === "found" ? ` Looks like ${lookup.hit.city} · ${offsetLabel(lookup.hit.utcOffsetSeconds)}.` : "";
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.fields}>
        <TextField id={`edit-name-${user.id}`} label="Name" value={name} autoComplete="off"
          state={error?.field === "name" ? "error" : "default"} onChange={(e) => { setName(e.target.value); setError(null); }} />
        <TextField id={`edit-zip-${user.id}`} label="Zip code" value={zip} inputMode="numeric" maxLength={5}
          state={error?.field === "zip" ? "error" : "default"}
          onChange={(e) => { setZip(e.target.value.replace(/\s/g, "").slice(0, 5)); setError(null); }} />
      </div>
      {zipChanged && (
        <p className={styles.zipNote} aria-live="polite">
          <Icon name="info" />
          <span>Location and UTC offset will update when you save.{ahead}</span>
        </p>
      )}
      {error && <p className={styles.formError} role="alert">{error.message}</p>}
      <div className={styles.actions} style={{ justifyContent: "flex-start" }}>
        <Button type="submit" label={saving ? "Saving…" : "Save changes"} state={saving ? "disabled" : "default"} />
        <Button variant="secondary" label="Cancel" onClick={onCancel} />
      </div>
    </form>
  );
}
