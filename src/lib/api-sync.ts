import type { ChetanaDB } from "@/lib/types";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

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

export async function pushDB(db: ChetanaDB): Promise<void> {
  const payload = withoutPurchasePhotos(db);
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Sync push failed: ${res.status}`);
  }
}

export async function pullDB(): Promise<ChetanaDB> {
  const res = await fetch("/api/db", { method: "GET" });
  if (!res.ok) {
    throw new Error(`Sync pull failed: ${res.status}`);
  }
  return (await res.json()) as ChetanaDB;
}
