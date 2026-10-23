import { Button } from "./Button";
import styles from "./Toast.module.css";

interface Props {
  /** Figma: Message */
  message: string;
  /** Figma: Undo. Shows the Undo button when set. */
  onUndo?: () => void;
  onDismiss: () => void;
}

export function Toast({ message, onUndo, onDismiss }: Props) {
  return (
    <div role="status" aria-live="polite" className={styles.toast}>
      <span className={styles.message}>{message}</span>
      {onUndo && <Button icon="undo" label="Undo" onClick={onUndo} />}
      <Button variant="ghost" icon="close" aria-label="Dismiss" className={styles.close} onClick={onDismiss} />
    </div>
  );
}
