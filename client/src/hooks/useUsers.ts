import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type User } from "../api";

export const UNDO_MS = 7000;
export const RETRY_PENDING_MS = 60_000;

const byName = (a: User, b: User) => a.name.localeCompare(b.name, "en", { sensitivity: "base" });

function message(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

/**
 * The people list and everything that changes it. Removing someone hides them
 * straight away but only sends the DELETE once the undo window closes.
 */
export function useUsers() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pending = useRef<{ user: User; timer: ReturnType<typeof setTimeout> } | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setUsers((await api.listUsers()).sort(byName));
    } catch (error) {
      setLoadError(message(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const put = (user: User) => setUsers((list) => [...(list ?? []).filter((u) => u.id !== user.id), user].sort(byName));

  const commitRemoval = useCallback((keepalive = false) => {
    const current = pending.current;
    if (!current) return;
    clearTimeout(current.timer);
    pending.current = null;
    setRemoved((r) => (r?.id === current.user.id ? null : r));
    api.deleteUser(current.user.id, { keepalive }).catch((error) => {
      if (error instanceof ApiError && error.code === "user_not_found") return;
      put(current.user);
      setNotice(`${current.user.name} couldn't be removed. ${message(error)}`);
    });
  }, []);

  // The card promises "We will retry the lookup", so pending locations are retried quietly.
  const usersRef = useRef(users);
  usersRef.current = users;
  useEffect(() => {
    const timer = setInterval(() => {
      for (const user of usersRef.current ?? []) {
        if (user.utcOffsetSeconds !== null) continue;
        api.refreshLocation(user.id).then(put, () => undefined);
      }
    }, RETRY_PENDING_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const flush = () => commitRemoval(true);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [commitRemoval]);

  return {
    users,
    loadError,
    reload: load,
    removed,
    notice,
    clearNotice: () => setNotice(null),

    async add(input: { name: string; zip: string }) {
      const user = await api.createUser(input);
      put(user);
      return user;
    },

    async update(id: string, patch: { name?: string; zip?: string }) {
      const user = await api.updateUser(id, patch);
      put(user);
      return user;
    },

    async refresh(id: string) {
      try {
        put(await api.refreshLocation(id));
      } catch (error) {
        setNotice(message(error));
      }
    },

    remove(user: User) {
      commitRemoval();
      setUsers((list) => (list ?? []).filter((u) => u.id !== user.id));
      setRemoved(user);
      pending.current = { user, timer: setTimeout(() => commitRemoval(), UNDO_MS) };
    },

    undo() {
      const current = pending.current;
      if (!current) return;
      clearTimeout(current.timer);
      pending.current = null;
      setRemoved(null);
      put(current.user);
    },

    dismissRemoved: () => commitRemoval(),
  };
}
