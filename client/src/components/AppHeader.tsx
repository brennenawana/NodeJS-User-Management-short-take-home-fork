import product from "../../../product.json";
import type { Theme } from "../hooks/useTheme";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { ViewToggle, type View } from "./ViewToggle";
import styles from "./AppHeader.module.css";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  view: View;
  onView: (view: View) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onAdd: () => void;
}

/** Figma: AppHeader. The Desktop and Mobile variants are one responsive layout here. */
export function AppHeader({ query, onQuery, view, onView, theme, onToggleTheme, onAdd }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo} aria-label={`${product.shortName} home`}>
          <span className={styles.mark}><Icon name="people" size={16} /></span>
          <span className={styles.wordmark}>{product.shortName}</span>
        </a>
        <label className={styles.search}>
          <span className={styles.searchIcon}><Icon name="search" /></span>
          <span className={styles.srOnly}>Search people</span>
          <input type="search" className={styles.searchInput} placeholder="Search by name or city" value={query} onChange={(e) => onQuery(e.target.value)} />
        </label>
        <ViewToggle active={view} onChange={onView} />
        <Button variant="secondary" icon={theme === "dark" ? "sun" : "moon"} aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={onToggleTheme} />
        <Button className={styles.add} icon="plus" label="Add a person" onClick={onAdd} />
      </div>
    </header>
  );
}
