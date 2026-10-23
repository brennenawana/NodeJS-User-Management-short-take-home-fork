import { Button } from "./Button";
import type { IconName } from "./Icon";
import styles from "./EmptyState.module.css";

interface Props {
  /** Figma: Title */
  title: string;
  /** Figma: Body */
  body: string;
  /** Figma: Show illustration */
  showIllustration?: boolean;
  /** Figma: Show action. The action shows when both are set. */
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}

export function EmptyState({ title, body, showIllustration = true, actionLabel, actionIcon = "plus", onAction }: Props) {
  return (
    <div className={styles.empty}>
      {showIllustration && (
        <svg width="132" height="60" viewBox="0 0 132 60" aria-hidden="true">
          <circle cx="30" cy="30" r="24" fill="var(--color-surface-2)" />
          <circle cx="66" cy="30" r="24" fill="var(--color-line-strong)" />
          <circle cx="102" cy="30" r="24" fill="var(--color-accent)" />
          <path d="M96 30h12M102 24v12" stroke="var(--color-on-accent)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      )}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
      {actionLabel && onAction && <Button className={styles.action} size="lg" icon={actionIcon} label={actionLabel} onClick={onAction} />}
    </div>
  );
}
