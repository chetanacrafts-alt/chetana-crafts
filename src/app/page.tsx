"use client";

import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { QuickActions } from "@/components/home/quick-actions";
import { LowStockAlert } from "@/components/home/low-stock-alert";
import { RecentOrders } from "@/components/home/recent-orders";
import { DuesAlert } from "@/components/orders/dues-alert";
import { buildPaymentReminderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import type { Order } from "@/lib/types";

export default function Home() {
  const { db } = useData();

  function handleRemind(order: Order) {
    if (!order.phone.trim()) {
      toast.warning("No phone number on this order.");
      return;
    }
    window.open(
      buildWhatsAppLink(order.phone, buildPaymentReminderMessage(order, db.settings)),
      "_blank"
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Home</h1>
      <QuickActions />
      <DuesAlert orders={db.orders} onRemind={handleRemind} />
      <LowStockAlert stock={db.stock} />
      <RecentOrders orders={db.orders} />
    </div>
  );
}
