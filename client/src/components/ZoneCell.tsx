import styles from "./ZoneCell.module.css";

interface Props {
  /** Figma: State. "you" marks the viewer's own offset: a plain, non-interactive cell. */
  state?: "default" | "active" | "you";
  /** Figma: Offset, e.g. "UTC−4" */
  offset: string;
  /** Figma: Hint, e.g. "Eastern" */
  hint?: string;
  /** Figma: Time */
  time: string;
  /** Figma: Relative, e.g. "+3h" */
  relative?: string;
  /** Figma: People, e.g. "3 people · Maya, Jonah, Lena" */
  people: string;
  onClick?: () => void;
}

export function ZoneCell({ state = "default", offset, hint, time, relative, people, onClick }: Props) {
  const body = (
    <>
      <span className={styles.top}>
        <span className={styles.offset}>{offset}</span>
        <span className={styles.sub}>{hint}</span>
      </span>
      <span className={styles.time}>{time}</span>
      {relative && <span className={styles.relative}>{relative}</span>}
      <span className={`${styles.sub} ${styles.people}`}>{people}</span>
    </>
  );
  if (state === "you") {
    return <div className={`${styles.cell} ${styles.you}`} aria-label={`Your time zone, ${offset}`}>{body}</div>;
  }
  return (
    <button type="button" className={`${styles.cell} ${state === "active" ? styles.active : ""}`} aria-pressed={state === "active"} onClick={onClick}>
      {body}
    </button>
  );
}
