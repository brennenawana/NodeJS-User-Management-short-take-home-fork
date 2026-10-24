import { Icon } from "./Icon";
import styles from "./NeedsAttention.module.css";

interface Props {
  /** Figma: Label */
  label: string;
  /** Figma: State. Active while the grid is filtered to these people. */
  state?: "default" | "active";
  onClick: () => void;
}

/** Figma: NeedsAttention. Counts people whose zip needs fixing and filters the grid to them. */
export function NeedsAttention({ label, state = "default", onClick }: Props) {
  return (
    <button type="button" className={`${styles.chip} ${state === "active" ? styles.active : ""}`} aria-pressed={state === "active"} onClick={onClick}>
      <Icon name="alert" size={16} />
      {label}
    </button>
  );
}
