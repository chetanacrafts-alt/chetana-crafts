import type { ChetanaDB, Expense, Order, OnlineSale, ReturnItem } from "@/lib/types";
import {
  lastNDates,
  lastNMonths,
  monthKeyFromDate,
  monthRange,
  shortMonthLabel,
  type MonthKey,
} from "@/lib/dates";

export function computeDirectSalesRevenue(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.price * o.qty, 0);
}

export function computeOnlineNetPayout(online: OnlineSale[]): number {
  return online.reduce((sum, o) => sum + o.payout, 0);
}

export function computeReturnsTotal(returns: ReturnItem[]): number {
  return returns.reduce((sum, r) => sum + r.amount, 0);
}

export function computeRevenue(
  orders: Order[],
  online: OnlineSale[],
  returns: ReturnItem[]
): number {
  return (
    computeDirectSalesRevenue(orders) + computeOnlineNetPayout(online) - computeReturnsTotal(returns)
  );
}

/** Cost basis of items actually sold (orders + online), unaffected by later returns. */
export function computeCOGS(orders: Order[], online: OnlineSale[]): number {
  const ordersCogs = orders.reduce((sum, o) => sum + o.cost * o.qty, 0);
  const onlineCogs = online.reduce((sum, o) => sum + o.cost, 0);
  return ordersCogs + onlineCogs;
}

/** Excludes "Stock Purchase" — that spend is already reflected in COGS once the
 * stock is sold, so counting it again here would double-count it. */
export function computeOtherExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.cat !== "Stock Purchase")
    .reduce((sum, e) => sum + e.amt, 0);
}

export function computePiecesSold(orders: Order[], online: OnlineSale[]): number {
  return (
    orders.reduce((sum, o) => sum + o.qty, 0) + online.reduce((sum, o) => sum + o.qty, 0)
  );
}

export function filterByDate<T extends { date: string }>(items: T[], date: string): T[] {
  return items.filter((i) => i.date === date);
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  start: string,
  end: string
): T[] {
  return items.filter((i) => i.date >= start && i.date <= end);
}

export interface PeriodSummary {
  revenue: number;
  cogs: number;
  otherExpenses: number;
  netProfit: number;
  ordersCount: number;
  piecesSold: number;
  expensesTotal: number;
}

function summarize(
  orders: Order[],
  online: OnlineSale[],
  returns: ReturnItem[],
  expenses: Expense[]
): PeriodSummary {
  const revenue = computeRevenue(orders, online, returns);
  const cogs = computeCOGS(orders, online);
  const otherExpenses = computeOtherExpenses(expenses);
  return {
    revenue,
    cogs,
    otherExpenses,
    netProfit: revenue - cogs - otherExpenses,
    ordersCount: orders.length,
    piecesSold: computePiecesSold(orders, online),
    expensesTotal: expenses.reduce((sum, e) => sum + e.amt, 0),
  };
}

export function summarizeDay(db: ChetanaDB, date: string): PeriodSummary {
  return summarize(
    filterByDate(db.orders, date),
    filterByDate(db.online, date),
    filterByDate(db.returns, date),
    filterByDate(db.expenses, date)
  );
}

export function summarizeRange(db: ChetanaDB, start: string, end: string): PeriodSummary {
  return summarize(
    filterByDateRange(db.orders, start, end),
    filterByDateRange(db.online, start, end),
    filterByDateRange(db.returns, start, end),
    filterByDateRange(db.expenses, start, end)
  );
}

export interface DayPoint {
  date: string;
  revenue: number;
}

export function dailyEarningsSeries(db: ChetanaDB, days: number, endISO: string): DayPoint[] {
  return lastNDates(days, endISO).map((date) => ({
    date,
    revenue: summarizeDay(db, date).revenue,
  }));
}

export interface MonthPoint {
  key: MonthKey;
  label: string;
  revenue: number;
  profit: number;
}

export function monthlyRevenueProfitSeries(
  db: ChetanaDB,
  months: number,
  endISO: string
): MonthPoint[] {
  const endKey = monthKeyFromDate(endISO);
  return lastNMonths(months, endKey).map((key) => {
    const { start, end } = monthRange(key);
    const summary = summarizeRange(db, start, end);
    return { key, label: shortMonthLabel(key), revenue: summary.revenue, profit: summary.netProfit };
  });
}

export interface CategorySpend {
  category: string;
  amount: number;
}

export function spendByCategory(expenses: Expense[]): CategorySpend[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.cat, (map.get(e.cat) ?? 0) + e.amt);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface TopItem {
  product: string;
  qty: number;
  revenue: number;
}

export function topSellingItems(orders: Order[], online: OnlineSale[], limit = 8): TopItem[] {
  const map = new Map<string, { qty: number; revenue: number }>();
  for (const o of orders) {
    const cur = map.get(o.product) ?? { qty: 0, revenue: 0 };
    cur.qty += o.qty;
    cur.revenue += o.price * o.qty;
    map.set(o.product, cur);
  }
  for (const o of online) {
    const cur = map.get(o.product) ?? { qty: 0, revenue: 0 };
    cur.qty += o.qty;
    cur.revenue += o.payout;
    map.set(o.product, cur);
  }
  return [...map.entries()]
    .map(([product, v]) => ({ product, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}
