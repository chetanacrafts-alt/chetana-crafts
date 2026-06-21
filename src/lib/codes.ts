import type { StockItem } from "@/lib/types";

const CODE_PATTERN = /^CC-(\d+)$/i;

export function nextStockCode(stock: StockItem[]): string {
  let max = 0;
  for (const item of stock) {
    const match = CODE_PATTERN.exec(item.code.trim());
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `CC-${String(max + 1).padStart(3, "0")}`;
}

export function isDuplicateCode(
  stock: StockItem[],
  code: string,
  excludeId?: string
): boolean {
  const norm = code.trim().toLowerCase();
  if (!norm) return false;
  return stock.some(
    (s) => s.id !== excludeId && s.code.trim().toLowerCase() === norm
  );
}

export function findStockByCode(
  stock: StockItem[],
  code: string
): StockItem | undefined {
  const norm = code.trim().toLowerCase();
  if (!norm) return undefined;
  return stock.find((s) => s.code.trim().toLowerCase() === norm);
}

/** Adds `delta` to the qty of the stock item matching `code` (no-op if blank/unmatched). */
export function adjustStockQtyByCode(
  stock: StockItem[],
  code: string,
  delta: number
): StockItem[] {
  const match = findStockByCode(stock, code);
  if (!match) return stock;
  return stock.map((s) => (s.id === match.id ? { ...s, qty: s.qty + delta } : s));
}

/** Short, readable code suffix derived from a colour name (e.g. "Mirror Work" -> "MIRR"). */
export function colorCodeSuffix(color: string, fallbackIndex: number): string {
  const cleaned = color.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
  return cleaned || String(fallbackIndex);
}

/** The code for one colour variant of an article. When there's only one variant
 * the article's own code is used as-is; with multiple variants each gets the
 * shared base code plus a colour suffix, so they can be tracked (and restocked)
 * as separate Stock rows while staying visibly grouped under one article. */
export function resolveVariantCode(
  baseCode: string,
  isMultiVariant: boolean,
  color: string,
  index: number
): string {
  if (!isMultiVariant) return baseCode;
  if (!baseCode) return "";
  return `${baseCode}-${colorCodeSuffix(color, index + 1)}`;
}
