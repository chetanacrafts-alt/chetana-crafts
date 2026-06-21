import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/orders/status-badge";
import { formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const recent = [...orders]
    .reverse()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No orders yet — use Take Order above to log your first one.
          </p>
        ) : (
          recent.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{o.name}</p>
                <p className="text-xs text-muted-foreground">
                  {o.product} ×{o.qty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(o.date)}</span>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
