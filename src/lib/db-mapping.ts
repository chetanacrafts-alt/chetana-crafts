import type {
  ChetanaDB,
  Order,
  StockItem,
  Expense,
  Purchase,
  OnlineSale,
  ReturnItem,
  BusinessSettings,
} from "@/lib/types";

type Row = Record<string, unknown>;

interface TableConfig<T> {
  table: string;
  idField: string;
  toRow: (item: T) => Row;
  fromRow: (row: Row) => T;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}
function num(v: unknown): number {
  return Number(v) || 0;
}

const ORDERS: TableConfig<Order> = {
  table: "orders",
  idField: "id",
  toRow: (o) => ({
    id: o.id,
    bill_no: o.billNo,
    date: o.date,
    name: o.name,
    phone: o.phone,
    channel: o.channel,
    product: o.product,
    price: o.price,
    cost: o.cost,
    qty: o.qty,
    status: o.status,
    stock_code: o.stockCode,
    pay_mode: o.payMode,
    paid_amount: o.paidAmount,
    due_amount: o.dueAmount,
    notify: o.notify,
  }),
  fromRow: (r) => ({
    id: str(r.id),
    billNo: str(r.bill_no),
    date: str(r.date),
    name: str(r.name),
    phone: str(r.phone),
    channel: str(r.channel),
    product: str(r.product),
    price: num(r.price),
    cost: num(r.cost),
    qty: num(r.qty),
    status: str(r.status),
    stockCode: str(r.stock_code),
    payMode: str(r.pay_mode),
    paidAmount: num(r.paid_amount),
    dueAmount: num(r.due_amount),
    notify: Boolean(r.notify),
  }),
};

const STOCK: TableConfig<StockItem> = {
  table: "stock",
  idField: "id",
  toRow: (s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    cat: s.cat,
    color: s.color,
    source: s.source,
    cost: s.cost,
    sell: s.sell,
    qty: s.qty,
    low: s.low,
  }),
  fromRow: (r) => ({
    id: str(r.id),
    code: str(r.code),
    name: str(r.name),
    cat: str(r.cat),
    color: str(r.color),
    source: str(r.source),
    cost: num(r.cost),
    sell: num(r.sell),
    qty: num(r.qty),
    low: num(r.low),
  }),
};

const EXPENSES: TableConfig<Expense> = {
  table: "expenses",
  idField: "id",
  toRow: (e) => ({ id: e.id, date: e.date, name: e.name, amt: e.amt, cat: e.cat }),
  fromRow: (r) => ({
    id: str(r.id),
    date: str(r.date),
    name: str(r.name),
    amt: num(r.amt),
    cat: str(r.cat),
  }),
};

// `photo` holds a Supabase Storage public URL (uploaded separately via
// /api/photos before the purchase is saved) — never a raw data URL, so it
// stays cheap to sync alongside the rest of the record.
const PURCHASES: TableConfig<Purchase> = {
  table: "purchases",
  idField: "id",
  toRow: (p) => ({
    id: p.id,
    date: p.date,
    supplier: p.supplier,
    city: p.city,
    items: p.items,
    total: p.total,
    extra: p.extra,
    photo: p.photo,
  }),
  fromRow: (r) => ({
    id: str(r.id),
    date: str(r.date),
    supplier: str(r.supplier),
    city: str(r.city),
    items: Array.isArray(r.items) ? (r.items as Purchase["items"]) : [],
    total: num(r.total),
    extra: num(r.extra),
    photo: str(r.photo),
  }),
};

const ONLINE_SALES: TableConfig<OnlineSale> = {
  table: "online_sales",
  idField: "id",
  toRow: (o) => ({
    id: o.id,
    date: o.date,
    platform: o.platform,
    orderid: o.orderid,
    product: o.product,
    stock_code: o.stockCode,
    qty: o.qty,
    value: o.value,
    fee: o.fee,
    shipping: o.shipping,
    cost: o.cost,
    payout: o.payout,
    status: o.status,
  }),
  fromRow: (r) => ({
    id: str(r.id),
    date: str(r.date),
    platform: str(r.platform),
    orderid: str(r.orderid),
    product: str(r.product),
    stockCode: str(r.stock_code),
    qty: num(r.qty),
    value: num(r.value),
    fee: num(r.fee),
    shipping: num(r.shipping),
    cost: num(r.cost),
    payout: num(r.payout),
    status: str(r.status),
  }),
};

const RETURNS: TableConfig<ReturnItem> = {
  table: "returns",
  idField: "id",
  toRow: (r) => ({
    id: r.id,
    date: r.date,
    name: r.name,
    phone: r.phone,
    stock_code: r.stockCode,
    product: r.product,
    qty: r.qty,
    amount: r.amount,
    reason: r.reason,
    refund_mode: r.refundMode,
    origin: r.origin,
  }),
  fromRow: (r) => ({
    id: str(r.id),
    date: str(r.date),
    name: str(r.name),
    phone: str(r.phone),
    stockCode: str(r.stock_code),
    product: str(r.product),
    qty: num(r.qty),
    amount: num(r.amount),
    reason: str(r.reason),
    refundMode: str(r.refund_mode),
    origin: str(r.origin),
  }),
};

const PLATFORMS: TableConfig<string> = {
  table: "platforms",
  idField: "name",
  toRow: (name) => ({ name }),
  fromRow: (r) => str(r.name),
};

export const ARRAY_TABLES = {
  orders: ORDERS,
  stock: STOCK,
  expenses: EXPENSES,
  purchases: PURCHASES,
  online: ONLINE_SALES,
  returns: RETURNS,
  platforms: PLATFORMS,
} as const;

const SETTINGS_ID = "singleton";

export function settingsToRow(s: BusinessSettings): Row {
  return { id: SETTINGS_ID, name: s.name, gstin: s.gstin, phone: s.phone, addr: s.addr };
}

export function rowToSettings(r: Row | null): BusinessSettings {
  if (!r) return { name: "", gstin: "", phone: "", addr: "" };
  return { name: str(r.name), gstin: str(r.gstin), phone: str(r.phone), addr: str(r.addr) };
}

export { SETTINGS_ID };
export type { Row };
