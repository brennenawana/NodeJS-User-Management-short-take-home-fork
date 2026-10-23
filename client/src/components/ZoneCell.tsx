import styles from "./ZoneCell.module.css";

interface Props {
  /** Figma: State */
  state?: "default" | "active";
  /** Figma: Offset, e.g. "UTC−4" */
  offset: string;
  /** Figma: Hint, e.g. "Eastern" */
  hint?: string;
  /** Figma: Time */
  time: string;
  /** Figma: People, e.g. "3 people · Maya, Jonah, Lena" */
  people: string;
  onClick?: () => void;
}

export function ZoneCell({ state = "default", offset, hint, time, people, onClick }: Props) {
  return (
    <button type="button" className={`${styles.cell} ${state === "active" ? styles.active : ""}`} aria-pressed={state === "active"} onClick={onClick}>
      <span className={styles.top}>
        <span className={styles.offset}>{offset}</span>
        <span className={styles.sub}>{hint}</span>
      </span>
      <span className={styles.time}>{time}</span>
      <span className={`${styles.sub} ${styles.people}`}>{people}</span>
    </button>
  );
}
