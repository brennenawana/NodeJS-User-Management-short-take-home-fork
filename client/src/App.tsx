import { useState } from "react";
import { isLocated, type User } from "./api";
import { AddSheet } from "./components/AddSheet";
import { AppHeader } from "./components/AppHeader";
import { Button } from "./components/Button";
import { EmptyState } from "./components/EmptyState";
import { PersonCard, type PersonCardState } from "./components/PersonCard";
import { TimezoneStrip } from "./components/TimezoneStrip";
import { Toast } from "./components/Toast";
import type { View } from "./components/ViewToggle";
import { useNow } from "./hooks/useNow";
import { useTheme } from "./hooks/useTheme";
import { useUsers } from "./hooks/useUsers";
import { offsetLabel } from "./lib/time";
import styles from "./App.module.css";

const plural = (n: number) => (n === 1 ? "1 person" : `${n} people`);

export function App() {
  const { theme, toggle } = useTheme();
  const now = useNow();
  const people = useUsers();
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<number | null>(null);
  const [view, setView] = useState<View>("grid");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const all = people.users ?? [];
  const q = query.trim().toLowerCase();
  const shown = all.filter((u) =>
    (!q || u.name.toLowerCase().includes(q) || (u.city ?? "").toLowerCase().includes(q)) &&
    (zone === null || u.utcOffsetSeconds === zone));
  const filtered = q !== "" || zone !== null;

  const cardState = (u: User): PersonCardState =>
    editingId === u.id ? "editing" : expandedId === u.id ? "expanded" : isLocated(u) ? "default" : "pendingLocation";

  const openSheet = () => setSheetOpen(true);
  const clearFilters = () => { setQuery(""); setZone(null); };

  return (
    <>
      <AppHeader query={query} onQuery={setQuery} view={view} onView={setView} theme={theme} onToggleTheme={toggle} onAdd={openSheet} />
      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.h1}>People</h1>
          {people.users && (
            <p className={styles.count}>{plural(all.length)}{filtered && shown.length !== all.length && ` · ${shown.length} shown`}</p>
          )}
          {zone !== null && (
            <Button variant="secondary" className={styles.chip} icon="close" label={`Showing ${offsetLabel(zone)} only`} onClick={() => setZone(null)} />
          )}
          <p className={styles.ticks}>Times update every minute</p>
        </div>

        <TimezoneStrip users={all} now={now} active={zone} onPick={setZone} />

        {sheetOpen && (
          <AddSheet now={now} onClose={() => setSheetOpen(false)}
            onSave={async (input) => {
              const user = await people.add(input);
              setSheetOpen(false);
              clearFilters();
              setExpandedId(user.id);
              return user;
            }} />
        )}

        {view === "map" && (
          <div className={styles.notice} role="note">The map view is on its way. Everyone is in the grid below for now.</div>
        )}

        {people.loadError ? (
          <EmptyState showIllustration={false} title="We couldn't load people" body={people.loadError} actionLabel="Try again" actionIcon="undo" onAction={people.reload} />
        ) : !people.users ? (
          <ul className={styles.grid} aria-label="Loading people" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => <PersonCard key={i} state="skeleton" />)}
          </ul>
        ) : all.length === 0 ? (
          !sheetOpen && (
            <EmptyState title="No one here yet" actionLabel="Add your first person" onAction={openSheet}
              body="Add your first person with a name and a zip. We will fill in the city, map point and local time." />
          )
        ) : shown.length === 0 ? (
          <EmptyState showIllustration={false} title={q ? `No one matches “${query.trim()}”` : `No one in ${offsetLabel(zone!)}`}
            body="Try a shorter name, a city like Boston, or clear the filters." actionLabel="Clear search and filters" actionIcon="close" onAction={clearFilters} />
        ) : (
          <ul className={styles.grid} aria-label="People">
            {shown.map((u, i) => (
              <PersonCard key={u.id} user={u} now={now} index={i} state={cardState(u)}
                onToggle={() => { setExpandedId(expandedId === u.id ? null : u.id); setEditingId(null); }}
                onEdit={() => { setExpandedId(u.id); setEditingId(u.id); }}
                onCancelEdit={() => setEditingId(null)}
                onSave={async (patch) => {
                  if (Object.keys(patch).length) await people.update(u.id, patch);
                  setEditingId(null);
                }}
                onRemove={() => { people.remove(u); if (expandedId === u.id) setExpandedId(null); setEditingId(null); }}
                onRefresh={() => people.refresh(u.id)} />
            ))}
          </ul>
        )}
      </main>

      {people.removed ? (
        <Toast message={`${people.removed.name} was removed.`} onUndo={people.undo} onDismiss={people.dismissRemoved} />
      ) : people.notice ? (
        <Toast message={people.notice} onDismiss={people.clearNotice} />
      ) : null}
    </>
  );
}
