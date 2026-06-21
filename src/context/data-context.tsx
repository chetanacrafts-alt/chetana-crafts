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
import { toast } from "sonner";
import type { ChetanaDB } from "@/lib/types";
import {
  defaultDB,
  loadDB,
  persistDB,
  parseImportedDB,
  getLastBackupAt,
  setLastBackupAt as persistLastBackupAt,
} from "@/lib/storage";
import {
  type SyncStatus,
  getSheetUrl,
  setSheetUrl as persistSheetUrl,
  clearSheetUrl,
  getLastSyncedAt,
  setLastSyncedAt as persistLastSyncedAt,
  writeAllToSheet,
  readFromSheet,
} from "@/lib/sync";

interface DataContextValue {
  db: ChetanaDB;
  hydrated: boolean;
  setDB: (updater: ChetanaDB | ((prev: ChetanaDB) => ChetanaDB)) => void;
  sheetUrl: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  connectSheet: (url: string) => Promise<void>;
  refreshFromSheet: () => Promise<void>;
  disconnectSheet: () => void;
  backupJSON: () => void;
  restoreJSON: (file: File) => Promise<void>;
  eraseAll: () => void;
  lastBackupAt: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<ChetanaDB>(() => defaultDB());
  const [hydrated, setHydrated] = useState(false);
  const [sheetUrl, setSheetUrlState] = useState<string | null>(null);
  // Only ever set from callbacks (connect/refresh/push), never from an effect body.
  // The exported `syncStatus` below folds in connectivity so the badge reflects
  // "Offline" instantly without needing to set it from inside an effect.
  const [phase, setPhase] = useState<SyncStatus>("offline");
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const dbRef = useRef(db);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncStatus: SyncStatus = !sheetUrl || !isOnline ? "offline" : phase;

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Hydrate from localStorage after mount. This must run in an effect (not during
  // render) so the very first paint matches the server-rendered HTML before we
  // swap in the real browser-only data — otherwise React would report a hydration
  // mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage/navigator on mount, see comment above
    setDbState(loadDB());
    setSheetUrlState(getSheetUrl());
    setLastSyncedAtState(getLastSyncedAt());
    setLastBackupAtState(getLastBackupAt());
    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setHydrated(true);
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persist every change to localStorage (works fully offline).
  useEffect(() => {
    if (!hydrated) return;
    persistDB(db);
  }, [db, hydrated]);

  const pushToSheet = useCallback(async () => {
    if (!sheetUrl || !isOnline) return;
    setPhase("syncing");
    try {
      await writeAllToSheet(sheetUrl, dbRef.current);
      const now = new Date().toISOString();
      persistLastSyncedAt(now);
      setLastSyncedAtState(now);
      setPhase("synced");
    } catch {
      setPhase("error");
    }
  }, [sheetUrl, isOnline]);

  // Debounced auto-sync whenever data changes, and whenever connectivity returns.
  // "Offline" itself is derived in `syncStatus` above, so this effect only ever
  // needs to schedule (or skip) the debounced push — no setState in the body.
  useEffect(() => {
    if (!hydrated || !sheetUrl || !isOnline) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      pushToSheet();
    }, 800);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [db, hydrated, sheetUrl, isOnline, pushToSheet]);

  const setDB = useCallback(
    (updater: ChetanaDB | ((prev: ChetanaDB) => ChetanaDB)) => {
      setDbState((prev) =>
        typeof updater === "function"
          ? (updater as (prev: ChetanaDB) => ChetanaDB)(prev)
          : updater
      );
    },
    []
  );

  const connectSheet = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    persistSheetUrl(trimmed);
    setSheetUrlState(trimmed);
    setPhase("syncing");
    try {
      await writeAllToSheet(trimmed, dbRef.current);
      const now = new Date().toISOString();
      persistLastSyncedAt(now);
      setLastSyncedAtState(now);
      setPhase("synced");
      toast.success("Connected to Google Sheet");
    } catch {
      setPhase("error");
      toast.error("Could not reach the Sheet. Check the URL and deployment.");
    }
  }, []);

  const refreshFromSheet = useCallback(async () => {
    if (!sheetUrl) return;
    setPhase("syncing");
    try {
      const data = await readFromSheet(sheetUrl);
      setDbState((prev) => {
        const photoById = new Map(prev.purchases.map((p) => [p.id, p.photo]));
        const purchases = Array.isArray(data.purchases)
          ? data.purchases.map((p) => ({ ...p, photo: photoById.get(p.id) ?? "" }))
          : prev.purchases;
        return {
          ...prev,
          ...data,
          purchases,
          settings: { ...prev.settings, ...(data.settings ?? {}) },
        };
      });
      const now = new Date().toISOString();
      persistLastSyncedAt(now);
      setLastSyncedAtState(now);
      setPhase("synced");
      toast.success("Refreshed from Google Sheet");
    } catch {
      setPhase("error");
      toast.error("Refresh failed. Check your connection and Sheet URL.");
    }
  }, [sheetUrl]);

  const disconnectSheet = useCallback(() => {
    clearSheetUrl();
    setSheetUrlState(null);
    setPhase("offline");
    toast.info("Disconnected from Google Sheet");
  }, []);

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

  const restoreJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseImportedDB(text);
    setDbState(parsed);
  }, []);

  const eraseAll = useCallback(() => {
    setDbState(defaultDB());
  }, []);

  return (
    <DataContext.Provider
      value={{
        db,
        hydrated,
        setDB,
        sheetUrl,
        syncStatus,
        lastSyncedAt,
        connectSheet,
        refreshFromSheet,
        disconnectSheet,
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
