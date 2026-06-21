import type { ChetanaDB } from "@/lib/types";

// Local cache only — the source of truth is Supabase, reached via /api/db
// (see src/lib/api-sync.ts). This lets the app paint instantly and tolerate
// brief offline stretches, reconciling with the server once back online.
export const DB_KEY = "chetana_crafts_db_v1";

export function defaultDB(): ChetanaDB {
  return {
    orders: [],
    stock: [],
    expenses: [],
    purchases: [],
    online: [],
    returns: [],
    platforms: [],
    settings: {
      name: "Chetana Crafts",
      gstin: "",
      phone: "",
      addr: "Rajkot, Gujarat",
    },
  };
}

function mergeWithDefaults(parsed: Partial<ChetanaDB> | null | undefined): ChetanaDB {
  const fallback = defaultDB();
  if (!parsed || typeof parsed !== "object") return fallback;
  return {
    orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
    stock: Array.isArray(parsed.stock) ? parsed.stock : fallback.stock,
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : fallback.expenses,
    purchases: Array.isArray(parsed.purchases) ? parsed.purchases : fallback.purchases,
    online: Array.isArray(parsed.online) ? parsed.online : fallback.online,
    returns: Array.isArray(parsed.returns) ? parsed.returns : fallback.returns,
    platforms: Array.isArray(parsed.platforms) ? parsed.platforms : fallback.platforms,
    settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
  };
}

export function loadDB(): ChetanaDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultDB();
  }
}

export function persistDB(db: ChetanaDB): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function parseImportedDB(raw: string): ChetanaDB {
  const parsed = JSON.parse(raw);
  return mergeWithDefaults(parsed);
}

const LAST_BACKUP_KEY = "chetana_crafts_last_backup_v1";

export function getLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_BACKUP_KEY);
}

export function setLastBackupAt(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_BACKUP_KEY, iso);
}

const LAST_SYNCED_KEY = "chetana_crafts_last_synced_v1";

export function getLastSyncedAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SYNCED_KEY);
}

export function setLastSyncedAt(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SYNCED_KEY, iso);
}
