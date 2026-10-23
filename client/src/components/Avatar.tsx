import type { CSSProperties } from "react";
import { avatarHue, initialsOf } from "../lib/people";
import styles from "./Avatar.module.css";

/** Figma: Avatar. Initials and hue both come from the name. */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const hue = avatarHue(name);
  const style = {
    "--avatar-bg": `var(--color-avatar-${hue}-bg)`,
    "--avatar-fg": `var(--color-avatar-${hue}-fg)`,
  } as CSSProperties;
  return <span aria-hidden="true" className={`${styles.avatar} ${styles[size]}`} style={style} data-hue={hue}>{initialsOf(name)}</span>;
}
