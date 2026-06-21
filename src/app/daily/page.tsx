"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { DateNav } from "@/components/daily/date-nav";
import { StatTiles } from "@/components/daily/stat-tiles";
import { DayOrdersTable, DayOnlineTable } from "@/components/daily/day-tables";
import { EarningsBarStrip } from "@/components/daily/earnings-bar-strip";
import { EarningsLineChart } from "@/components/daily/earnings-line-chart";
import { MonthlyBarChart } from "@/components/daily/monthly-bar-chart";
import {
  dailyEarningsSeries,
  filterByDate,
  monthlyRevenueProfitSeries,
  summarizeDay,
} from "@/lib/analytics";
import { todayISO } from "@/lib/format";

export default function DailyPage() {
  const { db } = useData();
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const summary = summarizeDay(db, selectedDate);
  const dayOrders = filterByDate(db.orders, selectedDate);
  const dayOnline = filterByDate(db.online, selectedDate);
  const last14 = dailyEarningsSeries(db, 14, todayISO());
  const last30 = dailyEarningsSeries(db, 30, todayISO());
  const months = monthlyRevenueProfitSeries(db, 6, todayISO());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium sm:text-3xl">Daily</h1>
        <DateNav date={selectedDate} onChange={setSelectedDate} />
      </div>

      <StatTiles summary={summary} />

      <EarningsBarStrip points={last14} selectedDate={selectedDate} onSelect={setSelectedDate} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DayOrdersTable orders={dayOrders} />
        <DayOnlineTable sales={dayOnline} />
      </div>

      <EarningsLineChart points={last30} />
      <MonthlyBarChart points={months} />
    </div>
  );
}
