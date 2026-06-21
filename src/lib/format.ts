import { formatISODate, parseISODate } from "@/lib/dates";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function marginPercent(cost: number, sell: number): number | null {
  if (!sell) return null;
  return ((sell - cost) / sell) * 100;
}

export function formatDate(iso: string): string {
  try {
    return parseISODate(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Today's date in the browser's local timezone — not UTC, so it matches the
 * shop's actual wall-clock day even right after local midnight. */
export function todayISO(): string {
  return formatISODate(new Date());
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
