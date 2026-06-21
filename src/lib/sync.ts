import type { ChetanaDB } from "@/lib/types";

export const SHEET_URL_KEY = "chetana_crafts_sheet_url_v1";
export const LAST_SYNCED_KEY = "chetana_crafts_last_synced_v1";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export function getSheetUrl(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SHEET_URL_KEY);
}

export function setSheetUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHEET_URL_KEY, url);
}

export function clearSheetUrl(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SHEET_URL_KEY);
}

export function getLastSyncedAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SYNCED_KEY);
}

export function setLastSyncedAt(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SYNCED_KEY, iso);
}

/** Strips purchase photo fields — photos never leave the device. */
function withoutPurchasePhotos(db: ChetanaDB): Omit<ChetanaDB, "purchases"> & {
  purchases: Array<Omit<ChetanaDB["purchases"][number], "photo">>;
} {
  return {
    ...db,
    purchases: db.purchases.map((p) => ({
      id: p.id,
      date: p.date,
      supplier: p.supplier,
      city: p.city,
      items: p.items,
      total: p.total,
      extra: p.extra,
    })),
  };
}

export async function writeAllToSheet(url: string, db: ChetanaDB): Promise<void> {
  const payload = withoutPurchasePhotos(db);
  const res = await fetch(url, {
    method: "POST",
    // text/plain avoids a CORS preflight against Apps Script web apps.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "writeAll", payload }),
  });
  if (!res.ok) {
    throw new Error(`Sheet write failed: ${res.status}`);
  }
}

export async function readFromSheet(url: string): Promise<Partial<ChetanaDB>> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}action=read`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Sheet read failed: ${res.status}`);
  }
  return (await res.json()) as Partial<ChetanaDB>;
}
