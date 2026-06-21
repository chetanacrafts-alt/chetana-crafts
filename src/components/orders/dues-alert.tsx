"use client";

import { useMemo } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/types";

interface DuesAlertProps {
  orders: Order[];
  onRemind: (order: Order) => void;
}

export function DuesAlert({ orders, onRemind }: DuesAlertProps) {
  const dueOrders = useMemo(
    () => orders.filter((o) => o.dueAmount > 0).sort((a, b) => b.dueAmount - a.dueAmount),
    [orders]
  );

  if (dueOrders.length === 0) return null;

  const totalDue = dueOrders.reduce((sum, o) => sum + o.dueAmount, 0);

  return (
    <Card className="border-destructive/30 bg-destructive/5 ring-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4.5" />
          Dues / Pending Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {dueOrders.length} order{dueOrders.length === 1 ? "" : "s"} with{" "}
          {formatCurrency(totalDue)} outstanding.
        </p>
        <div className="flex flex-col gap-2">
          {dueOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-background/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.product} · {formatCurrency(order.dueAmount)} due
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onRemind(order)}>
                <MessageCircle className="size-3.5" />
                Remind on WhatsApp
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
