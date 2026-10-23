import { Icon } from "./Icon";
import styles from "./ViewToggle.module.css";

export type View = "grid" | "map";

/** Figma: ViewToggle. `active` is the Figma "Active" variant. */
export function ViewToggle({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="View" className={styles.group}>
      {(["grid", "map"] as const).map((view) => (
        <button key={view} type="button" className={styles.option} aria-pressed={active === view} onClick={() => onChange(view)}>
          <Icon name={view} size={16} />
          <span className={styles.label}>{view === "grid" ? "Grid" : "Map"}</span>
        </button>
      ))}
    </div>
  );
}
