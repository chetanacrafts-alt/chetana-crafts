import type { ChetanaDB, ReturnItem } from "@/lib/types";
import { genId } from "@/lib/id";
import { adjustStockQtyByCode } from "@/lib/codes";

export interface ReturnInput {
  date: string;
  name: string;
  phone: string;
  stockCode: string;
  product: string;
  qty: number;
  amount: number;
  reason: string;
  refundMode: string;
  origin: string;
}

export function applyNewReturn(db: ChetanaDB, input: ReturnInput): ChetanaDB {
  const item: ReturnItem = { id: genId(), ...input };
  const stock = adjustStockQtyByCode(db.stock, input.stockCode, input.qty);
  return { ...db, stock, returns: [...db.returns, item] };
}

export function removeReturn(db: ChetanaDB, returnId: string): ChetanaDB {
  const existing = db.returns.find((r) => r.id === returnId);
  if (!existing) return db;
  const stock = adjustStockQtyByCode(db.stock, existing.stockCode, -existing.qty);
  return { ...db, stock, returns: db.returns.filter((r) => r.id !== returnId) };
}
