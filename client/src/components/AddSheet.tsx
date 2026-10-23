import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiError, type User, type ZipPreview } from "../api";
import { useZipLookup, type ZipLookup } from "../hooks/useZipLookup";
import { localClock, offsetLabel, SKY_LABEL, skyTime, zoneHint } from "../lib/time";
import { checkZipInput, lookupCopy, type ZipInput } from "../lib/zip";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { SkyChip } from "./SkyChip";
import { TextField } from "./TextField";
import styles from "./AddSheet.module.css";

/** Figma: AddSheet "State" variant. */
export type AddSheetState = "empty" | "lookingUp" | "resolved" | "invalidZip" | "lookupFailed";

function sheetState(input: ZipInput, lookup: ZipLookup): AddSheetState {
  if (input.kind === "idle") return "empty";
  if (input.kind !== "complete") return "invalidZip";
  if (lookup.status === "found") return "resolved";
  if (lookup.status === "unknown") return "invalidZip";
  if (lookup.status === "failed") return "lookupFailed";
  return "lookingUp";
}

const HINT_ICON: Record<AddSheetState, IconName | null> = {
  empty: null, lookingUp: "clock", resolved: "check", invalidZip: "alert", lookupFailed: "warning",
};

interface Props {
  now: Date;
  onSave: (input: { name: string; zip: string }) => Promise<User>;
  onClose: () => void;
  /** Called with the resolved zip, or null, so the map can preview it. */
  onPreview?: (hit: ZipPreview | null) => void;
  /** Starting values, like an input's defaultValue. */
  defaultName?: string;
  defaultZip?: string;
}

export function AddSheet({ now, onSave, onClose, onPreview, defaultName = "", defaultZip = "" }: Props) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, []);
  const [name, setName] = useState(defaultName);
  const [zip, setZip] = useState(defaultZip);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = checkZipInput(zip);
  const lookup = useZipLookup(zip);
  const state = sheetState(input, lookup);
  const hit = lookup.status === "found" ? lookup.hit : null;
  const complete = input.kind === "complete" ? input.zip : "";
  useEffect(() => {
    onPreview?.(hit);
    return () => onPreview?.(null);
  }, [hit, onPreview]);

  const hint =
    input.kind !== "complete" ? input.text
    : lookup.status === "found" ? `${lookup.hit.city} · ${offsetLabel(lookup.hit.utcOffsetSeconds)}`
    : lookup.status === "unknown" ? lookupCopy.unknown(complete)
    : lookup.status === "failed" ? lookupCopy.failed(complete)
    : lookupCopy.pending(complete);

  const saveAnyway = lookup.status === "unknown" || lookup.status === "failed";
  const canSave = !!name.trim() && (state === "resolved" || saveAnyway) && !saving;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), zip: complete });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const clock = hit ? localClock(hit.utcOffsetSeconds, now) : null;
  const sky = clock ? skyTime(clock) : null;
  const hintIcon = HINT_ICON[state];
  const pvPlace = hit ? `${hit.city} · ${offsetLabel(hit.utcOffsetSeconds)}`
    : state === "lookingUp" ? lookupCopy.pending(complete)
    : saveAnyway ? `${complete} · location pending`
    : "City appears here";
  const waitText = state === "lookingUp" ? "Local time and sky appear in a moment."
    : saveAnyway ? "We will keep retrying the lookup after you save."
    : "Local time and sky appear once we know the zip.";

  return (
    <section ref={ref} aria-labelledby={`${id}-title`} className={[styles.sheet, styles[state]].filter(Boolean).join(" ")} data-state={state}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.top}>
          <div>
            <h2 id={`${id}-title`} className={styles.title}>Add a person</h2>
            <p className={styles.lede}>Just a name and a zip. We look up their city and local time.</p>
          </div>
          <Button variant="ghost" icon="close" aria-label="Close add form" onClick={onClose} />
        </div>
        <div className={styles.fields}>
          <TextField id={`${id}-name`} label="Name" placeholder="e.g. Maya Okafor" autoComplete="off" autoFocus
            value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id={`${id}-zip`} label="Zip code" placeholder="5 digits" inputMode="numeric" autoComplete="postal-code" maxLength={5}
            inputClassName={styles.zipInput} value={zip} aria-describedby={`${id}-zip-hint`}
            state={state === "invalidZip" ? "error" : state === "resolved" ? "success" : "default"}
            onChange={(e) => setZip(e.target.value.replace(/\s/g, "").slice(0, 5))} />
        </div>
        <p id={`${id}-zip-hint`} className={styles.hint} aria-live="polite">
          {hintIcon && <Icon name={hintIcon} size={16} />}
          <span>{hint}</span>
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.buttons}>
          <Button type="submit" size="lg" label={saveAnyway ? "Save anyway" : "Add person"} state={canSave ? "default" : "disabled"} />
          <Button variant="secondary" size="lg" label="Cancel" onClick={onClose} />
        </div>
      </form>

      <div className={styles.preview} aria-label="Card preview">
        <p className={styles.eyebrow}>Card preview</p>
        <div className={styles.card}>
          <div className={styles.who}>
            <Avatar name={name || "New person"} />
            <div>
              <p className={`${styles.name} ${name.trim() ? "" : styles.placeholder}`}>{name.trim() || "Their name"}</p>
              <p className={styles.place}>{pvPlace}</p>
            </div>
          </div>
          {clock && sky && hit ? (
            <div className={styles.clockRow}>
              <div>
                <p className={styles.time}>{clock.text}</p>
                <p className={styles.period}>{SKY_LABEL[sky]}{zoneHint(hit.utcOffsetSeconds) && ` · ${zoneHint(hit.utcOffsetSeconds)}`}</p>
              </div>
              <SkyChip time={sky} label={`${SKY_LABEL[sky]} in ${hit.city}`} />
            </div>
          ) : (
            <p className={styles.waiting}>{waitText}</p>
          )}
        </div>
      </div>
    </section>
  );
}
