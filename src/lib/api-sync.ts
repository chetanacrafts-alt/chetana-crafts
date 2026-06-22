import type { ChetanaDB } from "@/lib/types";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export async function pushDB(db: ChetanaDB): Promise<void> {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(db),
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
