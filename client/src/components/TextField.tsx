import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value"> & {
  id: string;
  /** Figma: Label */
  label: string;
  /** Figma: Value */
  value: string;
  /** Figma: Hint (Show hint is on when set) */
  hint?: string;
  /** Figma: State. Focus comes from the browser. */
  state?: "default" | "error" | "success";
  inputClassName?: string;
};

export function TextField({ id, label, value, hint, state = "default", className, inputClassName, ...input }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={[styles.field, state !== "default" && styles[state], className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input id={id} value={value} className={[styles.input, inputClassName].filter(Boolean).join(" ")}
        aria-invalid={state === "error" || undefined} aria-describedby={hintId} {...input} />
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
    </div>
  );
}
