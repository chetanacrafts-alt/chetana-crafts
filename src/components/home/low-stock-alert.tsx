import Link from "next/link";
import { PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorDot } from "@/components/color-swatch-picker";
import type { StockItem } from "@/lib/types";

interface LowStockAlertProps {
  stock: StockItem[];
}

export function LowStockAlert({ stock }: LowStockAlertProps) {
  const low = stock.filter((s) => s.qty <= s.low);
  if (low.length === 0) return null;

  return (
    <Card className="border-warning/40 bg-warning/10 ring-warning/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-maroon-dark">
          <PackageX className="size-4.5" />
          Low Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {low.map((s) => (
          <Link
            key={s.id}
            href="/stock"
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 transition-colors hover:bg-background"
          >
            <div className="flex items-center gap-2">
              <ColorDot name={s.color} />
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.code}</p>
              </div>
            </div>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              {s.qty} left
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
