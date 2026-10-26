import { Icon } from "./Icon";
import styles from "./SortToggle.module.css";

export type Sort = "name" | "time";

const OPTIONS = [
  { sort: "name", label: "A–Z" },
  { sort: "time", label: "By time", icon: "clock" },
] as const;

/** Figma: SortToggle. `active` is the Figma "Active" variant. Same look as ViewToggle. */
export function SortToggle({ active, onChange }: { active: Sort; onChange: (sort: Sort) => void }) {
  return (
    <div role="group" aria-label="Sort people" className={styles.group}>
      {OPTIONS.map((o) => (
        <button key={o.sort} type="button" className={styles.option} aria-pressed={active === o.sort} onClick={() => onChange(o.sort)}>
          {"icon" in o && <Icon name={o.icon} size={16} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
