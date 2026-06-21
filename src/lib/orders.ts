import type { ChetanaDB, Order } from "@/lib/types";
import { genId } from "@/lib/id";
import { adjustStockQtyByCode } from "@/lib/codes";
import { round2 } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";

export interface OrderInput {
  date: string;
  name: string;
  phone: string;
  channel: string;
  status: string;
  stockCode: string;
  product: string;
  price: number;
  cost: number;
  qty: number;
  payMode: string;
  amountPaid: number;
  notify: boolean;
}

function computeOrderPayment(
  price: number,
  qty: number,
  payMode: string,
  amountPaid: number
): { paidAmount: number; dueAmount: number } {
  const total = price * qty;
  const paidAmount = payMode === "Partial/Due" ? Math.max(0, amountPaid) : total;
  const dueAmount = Math.max(0, total - paidAmount);
  return { paidAmount: round2(paidAmount), dueAmount: round2(dueAmount) };
}

export function buildOrderFromInput(
  input: OrderInput,
  id: string = genId(),
  billNo: string = ""
): Order {
  const { paidAmount, dueAmount } = computeOrderPayment(
    input.price,
    input.qty,
    input.payMode,
    input.amountPaid
  );
  return {
    id,
    billNo,
    date: input.date,
    name: input.name,
    phone: input.phone,
    channel: input.channel,
    product: input.product,
    price: input.price,
    cost: input.cost,
    qty: input.qty,
    status: input.status,
    stockCode: input.stockCode,
    payMode: input.payMode,
    paidAmount,
    dueAmount,
    notify: input.notify,
  };
}

export function applyOrder(db: ChetanaDB, order: Order): ChetanaDB {
  const stock = adjustStockQtyByCode(db.stock, order.stockCode, -order.qty);
  return { ...db, stock, orders: [...db.orders, order] };
}

export function applyOrderEdit(db: ChetanaDB, updated: Order): ChetanaDB {
  const existing = db.orders.find((o) => o.id === updated.id);
  if (!existing) return db;
  let stock = adjustStockQtyByCode(db.stock, existing.stockCode, existing.qty);
  stock = adjustStockQtyByCode(stock, updated.stockCode, -updated.qty);
  return {
    ...db,
    stock,
    orders: db.orders.map((o) => (o.id === updated.id ? updated : o)),
  };
}

export function removeOrder(db: ChetanaDB, orderId: string): ChetanaDB {
  const existing = db.orders.find((o) => o.id === orderId);
  if (!existing) return db;
  const stock = adjustStockQtyByCode(db.stock, existing.stockCode, existing.qty);
  return { ...db, stock, orders: db.orders.filter((o) => o.id !== orderId) };
}

export function nextOrderStatus(status: string): string {
  const idx = ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]);
  if (idx === -1) return ORDER_STATUSES[0];
  return ORDER_STATUSES[(idx + 1) % ORDER_STATUSES.length];
}
