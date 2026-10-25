import type { ComponentProps } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

type Props = Omit<ComponentProps<"button">, "children"> & {
  /** Figma: Variant */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Figma: State. "disabled" also disables the button. */
  state?: "default" | "disabled";
  /** Figma: Label. Omit for an icon-only button and give it an aria-label. */
  label?: string;
  /** Figma: Icon (Show icon is on when set) */
  icon?: IconName;
  size?: "md" | "lg";
};

export function Button({ variant = "primary", state = "default", label, icon, size = "md", className, type = "button", disabled, ...rest }: Props) {
  const classes = [styles.button, styles[variant], size === "lg" && styles.lg, !label && styles.iconOnly, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || state === "disabled"} {...rest}>
      {icon && <Icon name={icon} />}
      {label}
    </button>
  );
}
