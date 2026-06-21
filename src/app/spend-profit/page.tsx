"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { MonthNav } from "@/components/spend-profit/month-nav";
import { ProfitTiles } from "@/components/spend-profit/profit-tiles";
import { SpendByCategoryChart } from "@/components/spend-profit/spend-by-category-chart";
import { TopItemsChart } from "@/components/spend-profit/top-items-chart";
import { ExpenseForm, type ExpenseInput } from "@/components/spend-profit/expense-form";
import { ExpenseTable } from "@/components/spend-profit/expense-table";
import {
  filterByDateRange,
  spendByCategory,
  summarizeRange,
  topSellingItems,
} from "@/lib/analytics";
import { monthKeyFromDate, monthRange } from "@/lib/dates";
import { genId } from "@/lib/id";
import { todayISO } from "@/lib/format";

export default function SpendProfitPage() {
  const { db, setDB } = useData();
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(todayISO()));

  const { start, end } = monthRange(monthKey);
  const summary = summarizeRange(db, start, end);
  const monthExpenses = filterByDateRange(db.expenses, start, end);
  const monthOrders = filterByDateRange(db.orders, start, end);
  const monthOnline = filterByDateRange(db.online, start, end);
  const categorySpend = spendByCategory(monthExpenses);
  const topItems = topSellingItems(monthOrders, monthOnline);

  function handleAddExpense(input: ExpenseInput) {
    setDB((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { id: genId(), ...input }],
    }));
    toast.success("Expense added");
  }

  function handleDeleteExpense(id: string) {
    setDB((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
    toast.success("Expense deleted");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium sm:text-3xl">Spend &amp; Profit</h1>
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />
      </div>

      <ProfitTiles summary={summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendByCategoryChart data={categorySpend} />
        <TopItemsChart data={topItems} />
      </div>

      <ExpenseForm onSubmit={handleAddExpense} />
      <ExpenseTable expenses={monthExpenses} onDelete={handleDeleteExpense} />
    </div>
  );
}
