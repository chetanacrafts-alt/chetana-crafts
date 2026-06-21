"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MonthPoint } from "@/lib/analytics";

const GOLD = "#C9962F";
const MAROON = "#6E1313";
const GRID = "#E2D6BD";

export function MonthlyBarChart({ points }: { points: MonthPoint[] }) {
  const data = points.map((p) => ({
    label: p.label,
    Revenue: p.revenue,
    Profit: p.profit,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Profit (6 months)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={46} />
            <Tooltip
              formatter={(value: TooltipValueType | undefined) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill={MAROON} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
