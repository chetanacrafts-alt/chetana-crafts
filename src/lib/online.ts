import type { ChetanaDB, OnlineSale } from "@/lib/types";
import { genId } from "@/lib/id";
import { adjustStockQtyByCode } from "@/lib/codes";
import { round2 } from "@/lib/format";

export interface OnlineSaleInput {
  date: string;
  platform: string;
  orderid: string;
  stockCode: string;
  product: string;
  qty: number;
  value: number;
  fee: number;
  shipping: number;
  cost: number;
  status: string;
}

export function buildOnlineSaleFromInput(
  input: OnlineSaleInput,
  id: string = genId()
): OnlineSale {
  const payout = round2(Math.max(0, input.value - input.fee - input.shipping));
  return {
    id,
    date: input.date,
    platform: input.platform,
    orderid: input.orderid,
    product: input.product,
    stockCode: input.stockCode,
    qty: input.qty,
    value: input.value,
    fee: input.fee,
    shipping: input.shipping,
    cost: input.cost,
    payout,
    status: input.status,
  };
}

export function applyOnlineSale(db: ChetanaDB, sale: OnlineSale): ChetanaDB {
  const stock = adjustStockQtyByCode(db.stock, sale.stockCode, -sale.qty);
  return { ...db, stock, online: [...db.online, sale] };
}

export function removeOnlineSale(db: ChetanaDB, id: string): ChetanaDB {
  const existing = db.online.find((o) => o.id === id);
  if (!existing) return db;
  const stock = adjustStockQtyByCode(db.stock, existing.stockCode, existing.qty);
  return { ...db, stock, online: db.online.filter((o) => o.id !== id) };
}
