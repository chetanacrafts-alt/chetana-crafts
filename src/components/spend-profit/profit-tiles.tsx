import { TrendingUp, Package, Receipt, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PeriodSummary } from "@/lib/analytics";

interface ProfitTilesProps {
  summary: PeriodSummary;
}

export function ProfitTiles({ summary }: ProfitTilesProps) {
  const profitable = summary.netProfit >= 0;
  const tiles = [
    { label: "Revenue", value: summary.revenue, icon: TrendingUp, tone: "default" as const },
    { label: "Cost of Goods", value: summary.cogs, icon: Package, tone: "default" as const },
    { label: "Other Expenses", value: summary.otherExpenses, icon: Receipt, tone: "default" as const },
    {
      label: "Net Profit",
      value: summary.netProfit,
      icon: Wallet,
      tone: profitable ? ("positive" as const) : ("negative" as const),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card
            key={t.label}
            className={cn(
              t.tone === "negative" && "border-destructive/40 bg-destructive/5 ring-destructive/20",
              t.tone === "positive" && "border-success/40 bg-success/5 ring-success/20"
            )}
          >
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <t.icon className="size-3.5" />
                {t.label}
              </div>
              <p
                className={cn(
                  "text-xl font-semibold",
                  t.tone === "negative"
                    ? "text-destructive"
                    : t.tone === "positive"
                      ? "text-success"
                      : "text-brand-maroon-dark"
                )}
              >
                {formatCurrency(t.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Other Expenses excludes Stock Purchase costs — those are already counted in
        Cost of Goods once the items sell, so they aren&apos;t double-counted here.
      </p>
    </div>
  );
}
