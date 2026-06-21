"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shortDayLabel } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DayPoint } from "@/lib/analytics";

interface EarningsBarStripProps {
  points: DayPoint[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function EarningsBarStrip({ points, selectedDate, onSelect }: EarningsBarStripProps) {
  const max = Math.max(1, ...points.map((p) => p.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 14 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
          {points.map((p) => {
            const heightPct = p.revenue > 0 ? Math.max(6, (p.revenue / max) * 100) : 2;
            const isSelected = p.date === selectedDate;
            return (
              <button
                key={p.date}
                type="button"
                onClick={() => onSelect(p.date)}
                className="flex min-w-9 flex-1 flex-col items-center gap-1"
                title={`${formatDate(p.date)}: ${formatCurrency(p.revenue)}`}
              >
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-colors",
                      isSelected ? "bg-brand-maroon" : "bg-brand-gold/50 hover:bg-brand-gold"
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[0.65rem]",
                    isSelected ? "font-semibold text-brand-maroon-dark" : "text-muted-foreground"
                  )}
                >
                  {shortDayLabel(p.date).split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
