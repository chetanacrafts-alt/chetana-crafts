"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { ChetanaDB } from "@/lib/types";
import {
  defaultDB,
  loadDB,
  persistDB,
  parseImportedDB,
  getLastBackupAt,
  setLastBackupAt as persistLastBackupAt,
  getLastSyncedAt,
  setLastSyncedAt as persistLastSyncedAt,
} from "@/lib/storage";
import { type SyncStatus, pushDB, pullDB } from "@/lib/api-sync";

const POLL_INTERVAL_MS = 25000;
const SUPPRESS_POLL_AFTER_PUSH_MS = 8000;

interface DataContextValue {
  db: ChetanaDB;
  hydrated: boolean;
  initialSyncAttempted: boolean;
  setDB: (updater: ChetanaDB | ((prev: ChetanaDB) => ChetanaDB)) => void;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  backupJSON: () => void;
  restoreJSON: (file: File) => Promise<void>;
  eraseAll: () => Promise<void>;
  lastBackupAt: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [db, setDbState] = useState<ChetanaDB>(() => defaultDB());
  const [hydrated, setHydrated] = useState(false);
  // Only ever set from callbacks (mount pull/poll/push), never from an effect body.
  // The exported `syncStatus` below folds in connectivity so the badge reflects
  // "Offline" instantly without needing to set it from inside an effect.
  const [phase, setPhase] = useState<SyncStatus>("offline");
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  // Gates the debounced auto-push — until the first pull succeeds, the local
  // cache may still be empty/stale, so pushing it would overwrite the server
  // with nothing. Flips true on the first successful pull, or on eraseAll/
  // restoreJSON, which intentionally push a known-good local state.
  const [canPush, setCanPush] = useState(false);
  // True once the first pull attempt has finished, success or failure. Used
  // to briefly hold back UI that suggests a value derived from existing data
  // (next invoice number, next stock code) — on a brand-new device, that data
  // may still be the empty default for the first second or two, and acting on
  // it (e.g. saving) could create a real collision once the real data lands.
  // Bounded to one attempt, not gated on success, so offline use is never
  // blocked indefinitely.
  const [initialSyncAttempted, setInitialSyncAttempted] = useState(false);

  const dbRef = useRef(db);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPushAt = useRef(0);
  const pullInFlight = useRef(false);
  // Serializes pushes so two overlapping requests can never complete out of
  // order and have a stale one win — see pushNow below.
  const pushInFlight = useRef(false);
  const pushQueued = useRef(false);
  // localVersion bumps on every real local edit (setDB). pushedVersion records
  // the version that was last successfully confirmed-pushed. A pull is only
  // allowed to overwrite local state when the two match — i.e. there is no
  // local edit, old or brand new, that the server doesn't already have. A
  // pull that resolves slowly (e.g. the initial mount pull racing a quick
  // edit right after) would otherwise blindly replace state and silently
  // discard whatever the user just did.
  const localVersion = useRef(0);
  const pushedVersion = useRef(0);

  const syncStatus: SyncStatus = !isOnline ? "offline" : phase;

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Merges server data into local state, preserving purchase photos (which
  // never leave the device — the server never has them).
  const mergeFromServer = useCallback((data: ChetanaDB) => {
    setDbState((prev) => {
      const photoById = new Map(prev.purchases.map((p) => [p.id, p.photo]));
      const purchases = data.purchases.map((p) => ({
        ...p,
        photo: photoById.get(p.id) ?? "",
      }));
      return { ...data, purchases };
    });
  }, []);

  const pullFromServer = useCallback(
    async (options: { silent: boolean }) => {
      if (pullInFlight.current) return;
      if (!options.silent && Date.now() - lastPushAt.current < SUPPRESS_POLL_AFTER_PUSH_MS) return;
      pullInFlight.current = true;
      if (!options.silent) setPhase("syncing");
      try {
        const data = await pullDB();
        // Only adopt the server's state if nothing local is still unpushed —
        // otherwise this pull is stale relative to an edit already in flight
        // (or about to be) and applying it would silently lose that edit.
        if (localVersion.current === pushedVersion.current) {
          mergeFromServer(data);
        }
        const now = new Date().toISOString();
        persistLastSyncedAt(now);
        setLastSyncedAtState(now);
        setPhase("synced");
        setCanPush(true);
      } catch {
        setPhase("error");
      } finally {
        pullInFlight.current = false;
        setInitialSyncAttempted(true);
      }
    },
    [mergeFromServer]
  );

  // Hydrate from the local cache after mount (instant paint), then reconcile
  // with Supabase. This must run in an effect (not during render) so the very
  // first paint matches the server-rendered HTML before we swap in real data.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage/navigator on mount, see comment above
    setDbState(loadDB());
    setLastSyncedAtState(getLastSyncedAt());
    setLastBackupAtState(getLastBackupAt());
    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setHydrated(true);
    pullFromServer({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  // DataProvider lives in the root layout, so it's already mounted (and has
  // already run its one mount-time pull) while the user is still on the
  // unauthenticated /login page — that pull 401s, which is expected. Logging
  // in navigates to "/" via the router (no full page reload), so DataProvider
  // never remounts and never retries automatically. Re-pull specifically on
  // the /login -> elsewhere transition so the badge and data don't stay
  // stuck on that initial failed attempt for the rest of the session.
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current === "/login" && pathname !== "/login") {
      pullFromServer({ silent: false });
    }
    prevPathname.current = pathname;
  }, [pathname, pullFromServer]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      pullFromServer({ silent: true });
    }
    function handleOffline() {
      setIsOnline(false);
    }
    function handleFocus() {
      pullFromServer({ silent: true });
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") pullFromServer({ silent: true });
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pullFromServer]);

  // Periodic background pull — replaces the old manual "Refresh from Sheet"
  // button, so changes made on another device show up automatically.
  useEffect(() => {
    if (!hydrated) return;
    pollTimer.current = setInterval(() => {
      if (document.visibilityState === "visible") pullFromServer({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [hydrated, pullFromServer]);

  // Persist every change to the local cache (works fully offline).
  useEffect(() => {
    if (!hydrated) return;
    persistDB(db);
  }, [db, hydrated]);

  // The actual push, with no gating — used directly by callers (eraseAll,
  // restoreJSON) that already know they want to push a specific known-good
  // state right now, regardless of whether the initial pull has resolved.
  //
  // Pushes are serialized (never sent concurrently): if one is already in
  // flight, this just marks another push as queued and returns — the
  // in-flight push, on completion, re-pushes whatever is current in dbRef.
  // Without this, an earlier-started auto-push and a later explicit push
  // (e.g. eraseAll) could resolve out of order over the network, letting the
  // stale one silently win and undo the newer one.
  const pushNow = useCallback(async () => {
    if (!isOnline) return;
    if (pushInFlight.current) {
      pushQueued.current = true;
      return;
    }
    pushInFlight.current = true;
    setPhase("syncing");
    try {
      let versionPushed = pushedVersion.current;
      do {
        pushQueued.current = false;
        versionPushed = localVersion.current;
        await pushDB(dbRef.current);
      } while (pushQueued.current);
      pushedVersion.current = versionPushed;
      lastPushAt.current = Date.now();
      const now = new Date().toISOString();
      persistLastSyncedAt(now);
      setLastSyncedAtState(now);
      setPhase("synced");
    } catch {
      setPhase("error");
    } finally {
      pushInFlight.current = false;
    }
  }, [isOnline]);

  // Gated wrapper for the automatic debounced push — never fires before the
  // first successful pull, so a fresh/stale local cache can't race ahead of
  // reconciliation and overwrite the server (see canPush comment above).
  const pushToServer = useCallback(async () => {
    if (!canPush) return;
    await pushNow();
  }, [canPush, pushNow]);

  // Debounced auto-push whenever data changes.
  useEffect(() => {
    if (!hydrated || !isOnline || !canPush) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      pushToServer();
    }, 800);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [db, hydrated, isOnline, canPush, pushToServer]);

  const setDB = useCallback(
    (updater: ChetanaDB | ((prev: ChetanaDB) => ChetanaDB)) => {
      localVersion.current += 1;
      setDbState((prev) =>
        typeof updater === "function"
          ? (updater as (prev: ChetanaDB) => ChetanaDB)(prev)
          : updater
      );
    },
    []
  );

  const backupJSON = useCallback(() => {
    const data = JSON.stringify(dbRef.current, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `chetana-crafts-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    persistLastBackupAt(now);
    setLastBackupAtState(now);
  }, []);

  // Erase/restore push immediately rather than waiting on the debounce, so
  // Supabase is visibly cleared/repopulated right away instead of racing the
  // next periodic poll.
  const restoreJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseImportedDB(text);
    localVersion.current += 1;
    setDbState(parsed);
    dbRef.current = parsed;
    setCanPush(true);
    await pushNow();
  }, [pushNow]);

  const eraseAll = useCallback(async () => {
    const empty = defaultDB();
    localVersion.current += 1;
    setDbState(empty);
    dbRef.current = empty;
    setCanPush(true);
    await pushNow();
  }, [pushNow]);

  return (
    <DataContext.Provider
      value={{
        db,
        hydrated,
        initialSyncAttempted,
        setDB,
        syncStatus,
        lastSyncedAt,
        backupJSON,
        restoreJSON,
        eraseAll,
        lastBackupAt,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
