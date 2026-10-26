import { useCallback, useEffect, useRef, useState } from "react";
import { needsAttention, type User, type ZipPreview } from "./api";
import { AddSheet } from "./components/AddSheet";
import { AppHeader } from "./components/AppHeader";
import { Button } from "./components/Button";
import { EmptyState } from "./components/EmptyState";
import { MapView } from "./components/MapView";
import { NeedsAttention } from "./components/NeedsAttention";
import { PersonCard, type PersonCardState } from "./components/PersonCard";
import { TimezoneStrip } from "./components/TimezoneStrip";
import { Toast } from "./components/Toast";
import type { View } from "./components/ViewToggle";
import { useNow } from "./hooks/useNow";
import { useTheme } from "./hooks/useTheme";
import { useUsers } from "./hooks/useUsers";
import { viewerOffsetSeconds } from "./lib/relative";
import { offsetLabel } from "./lib/time";
import styles from "./App.module.css";

const plural = (n: number) => (n === 1 ? "1 person" : `${n} people`);

const FLAG_STATE: Record<User["locationStatus"], PersonCardState> = {
  located: "default", pending: "pendingLocation", cantLocate: "cantLocate", invalidZip: "invalidZip",
};

export function App() {
  const { theme, toggle } = useTheme();
  const now = useNow();
  const viewerOffset = viewerOffsetSeconds(now);
  const people = useUsers();
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<number | null>(null);
  const [attentionFilter, setAttentionFilter] = useState(false);
  const [view, setView] = useState<View>("grid");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ZipPreview | null>(null);
  const onPreview = useCallback((hit: ZipPreview | null) => setPreview(hit), []);

  const all = people.users ?? [];
  const flagged = all.filter(needsAttention);
  const attentionOnly = attentionFilter && flagged.length > 0;
  const q = query.trim().toLowerCase();
  const shown = all.filter((u) =>
    (!q || u.name.toLowerCase().includes(q) || (u.city ?? "").toLowerCase().includes(q)) &&
    (zone === null || u.utcOffsetSeconds === zone) &&
    (!attentionOnly || needsAttention(u)));
  const filtered = q !== "" || zone !== null || attentionOnly;

  const cardState = (u: User): PersonCardState =>
    editingId === u.id ? "editing" : expandedId === u.id ? "expanded" : FLAG_STATE[u.locationStatus];

  // Closing the sheet hands focus back to whichever Add button opened it.
  const opener = useRef<HTMLElement | null>(null);
  const openSheet = () => {
    opener.current = document.activeElement as HTMLElement | null;
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  };
  // A press outside the expanded card collapses it. Not while it's being edited (that
  // would throw away typing), and not from the toast, a menu or the map, which decide for themselves.
  useEffect(() => {
    if (!expandedId || editingId) return;
    const away = (e: PointerEvent) => {
      const target = e.target as Element;
      if (target.closest(`#person-${CSS.escape(expandedId)}, [role="status"], [role="menu"], [aria-label="Map of people"]`)) return;
      setExpandedId(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [expandedId, editingId]);

  const focusCard = (id: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`#person-${id} button`)?.focus());
  const clearFilters = () => { setQuery(""); setZone(null); setAttentionFilter(false); };

  return (
    <>
      <AppHeader query={query} onQuery={setQuery} view={view} onView={setView} theme={theme} onToggleTheme={toggle} onAdd={openSheet} />
      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.h1}>People</h1>
          {people.users && (
            <p className={styles.count}>{plural(all.length)}{filtered && shown.length !== all.length && ` · ${shown.length} shown`}</p>
          )}
          {flagged.length > 0 && (
            <NeedsAttention state={attentionOnly ? "active" : "default"} onClick={() => setAttentionFilter(!attentionOnly)}
              label={`${flagged.length === 1 ? "1 person needs" : `${flagged.length} people need`} attention`} />
          )}
          {zone !== null && (
            <Button variant="secondary" className={styles.chip} icon="close" label={`Showing ${offsetLabel(zone)} only`} onClick={() => setZone(null)} />
          )}
          <p className={styles.ticks}>Times update every minute</p>
        </div>

        <TimezoneStrip users={all} now={now} active={zone} onPick={setZone} />

        {sheetOpen && (
          <AddSheet now={now} onClose={closeSheet} onPreview={onPreview}
            onSave={async (input) => {
              const user = await people.add(input);
              setSheetOpen(false);
              clearFilters();
              setExpandedId(user.id);
              focusCard(user.id);
              return user;
            }} />
        )}

        {view === "map" && people.users && (
          <MapView users={all} visible={new Set(shown.map((u) => u.id))} selectedId={expandedId} now={now} preview={preview}
            onSelect={(id) => {
              const opening = expandedId !== id;
              setExpandedId(opening ? id : null);
              setEditingId(null);
              if (opening) requestAnimationFrame(() => document.getElementById(`person-${id}`)?.scrollIntoView?.({ behavior: "smooth", block: "nearest" }));
            }} />
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
          <EmptyState showIllustration={false} title={q ? `No one matches “${query.trim()}”` : zone !== null ? `No one in ${offsetLabel(zone)}` : "No one needs attention"}
            body="Try a shorter name, a city like Boston, or clear the filters." actionLabel="Clear search and filters" actionIcon="close" onAction={clearFilters} />
        ) : (
          <ul className={styles.grid} aria-label="People">
            {shown.map((u, i) => (
              <PersonCard key={u.id} user={u} now={now} viewerOffset={viewerOffset} index={i} state={cardState(u)}
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

      {!sheetOpen && <Button className={styles.fab} icon="plus" label="Add a person" onClick={openSheet} />}

      {people.removed ? (
        <Toast message={`${people.removed.name} was removed.`} onUndo={people.undo} onDismiss={people.dismissRemoved} />
      ) : people.notice ? (
        <Toast message={people.notice} onDismiss={people.clearNotice} />
      ) : null}
    </>
  );
}
