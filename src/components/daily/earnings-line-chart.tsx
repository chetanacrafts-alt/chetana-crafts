"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shortDayLabel } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import type { DayPoint } from "@/lib/analytics";

const MAROON = "#6E1313";
const GRID = "#E2D6BD";

export function EarningsLineChart({ points }: { points: DayPoint[] }) {
  const data = points.map((p) => ({ label: shortDayLabel(p.date), revenue: p.revenue }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Earnings (30 days)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
            />
            <YAxis tick={{ fontSize: 11 }} width={46} />
            <Tooltip
              formatter={(value: TooltipValueType | undefined) => formatCurrency(Number(value))}
            />
            <Line type="monotone" dataKey="revenue" stroke={MAROON} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
