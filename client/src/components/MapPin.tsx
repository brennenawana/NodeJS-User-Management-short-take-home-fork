import type { CSSProperties } from "react";
import { avatarHue, firstName, initialsOf } from "../lib/people";
import type { PinSide } from "../lib/map";
import styles from "./MapPin.module.css";

interface Props {
  /** Figma: Name */
  name: string;
  /** Figma: Side */
  side?: PinSide;
  /** Figma: Selected */
  selected?: boolean;
  x: number;
  y: number;
  label: string;
  dimmed?: boolean;
  onClick?: () => void;
}

/** Figma: MapPin. An avatar dot with a first-name chip beside it. */
export function MapPin({ name, side = "right", selected = false, x, y, label, dimmed = false, onClick }: Props) {
  const hue = avatarHue(name);
  const style = {
    left: `${x}%`, top: `${y}%`,
    "--avatar-bg": `var(--color-avatar-${hue}-bg)`, "--avatar-fg": `var(--color-avatar-${hue}-fg)`,
  } as CSSProperties;
  return (
    <button type="button" className={[styles.pin, styles[side], selected && styles.selected, dimmed && styles.dimmed].filter(Boolean).join(" ")}
      style={style} aria-label={label} aria-pressed={selected} data-side={side} data-dimmed={dimmed || undefined} onClick={onClick}>
      <span aria-hidden="true" className={styles.dot}>{initialsOf(name)}</span>
      <span aria-hidden="true" className={styles.chip}>{firstName(name)}</span>
    </button>
  );
}

export function PreviewPin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div aria-hidden="true" className={styles.preview} style={{ left: `${x}%`, top: `${y}%` }} data-testid="preview-pin">
      <span className={styles.previewRing} />
      <span className={styles.previewDot} />
      <span className={styles.previewLabel}>{label}</span>
    </div>
  );
}
