import { Icon } from "./Icon";
import styles from "./ViewToggle.module.css";

export type View = "grid" | "list" | "map";

const LABEL: Record<View, string> = { grid: "Grid", list: "List", map: "Map" };

/** Figma: ViewToggle. `active` is the Figma "Active" variant. */
export function ViewToggle({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="View" className={styles.group}>
      {(["grid", "list", "map"] as const).map((view) => (
        <button key={view} type="button" className={styles.option} aria-pressed={active === view} onClick={() => onChange(view)}>
          <Icon name={view} size={16} />
          <span className={styles.label}>{LABEL[view]}</span>
        </button>
      ))}
    </div>
  );
}
