import { ShoppingBag, TrendingUp, Package, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { PeriodSummary } from "@/lib/analytics";

interface StatTilesProps {
  summary: PeriodSummary;
}

export function StatTiles({ summary }: StatTilesProps) {
  const tiles = [
    { label: "Orders", value: String(summary.ordersCount), icon: ShoppingBag },
    { label: "Earnings", value: formatCurrency(summary.revenue), icon: TrendingUp },
    { label: "Pieces Sold", value: String(summary.piecesSold), icon: Package },
    { label: "Expenses", value: formatCurrency(summary.expensesTotal), icon: Receipt },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <t.icon className="size-3.5" />
              {t.label}
            </div>
            <p className="text-xl font-semibold text-brand-maroon-dark">{t.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
