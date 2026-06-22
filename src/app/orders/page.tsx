"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { DuesAlert } from "@/components/orders/dues-alert";
import { OrderForm } from "@/components/orders/order-form";
import { OrdersTable } from "@/components/orders/orders-table";
import { QuickReturnDialog } from "@/components/orders/quick-return-dialog";
import {
  applyOrder,
  applyOrderEdit,
  buildOrderFromInput,
  nextOrderStatus,
  removeOrder,
  type OrderInput,
} from "@/lib/orders";
import { applyNewReturn, type ReturnInput } from "@/lib/returns";
import {
  buildOrderConfirmationMessage,
  buildOrderStatusMessage,
  buildPaymentReminderMessage,
  buildWhatsAppLink,
} from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { db, setDB, syncNow } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);
  const editingOrder = editingId
    ? db.orders.find((o) => o.id === editingId) ?? null
    : null;

  function notifyCustomer(order: Order) {
    if (!order.phone.trim()) {
      toast.warning("Add a phone number to notify the customer on WhatsApp.");
      return;
    }
    window.open(
      buildWhatsAppLink(order.phone, buildOrderConfirmationMessage(order, db.settings)),
      "_blank"
    );
  }

  // Awaits the sync before opening WhatsApp: on mobile that backgrounds the
  // tab, and a save that's merely "in progress" can get starved before it
  // reaches Supabase, leaving the order saved on-device but invisible
  // everywhere else.
  async function handleSubmit(input: OrderInput) {
    const order = buildOrderFromInput(input, editingId ?? undefined, editingOrder?.billNo ?? "");

    setDB((prev) => (editingId ? applyOrderEdit(prev, order) : applyOrder(prev, order)));

    toast.success(
      order.dueAmount > 0
        ? `Order saved — ${formatCurrency(order.dueAmount)} due`
        : "Order saved"
    );

    if (input.notify) {
      await syncNow();
      notifyCustomer(order);
    }

    setEditingId(null);
    setFormKey((k) => k + 1);
  }

  function handleDelete(id: string) {
    setDB((prev) => removeOrder(prev, id));
    toast.success("Order deleted — stock restored");
    if (editingId === id) setEditingId(null);
  }

  function handleCycleStatus(order: Order) {
    setDB((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id ? { ...o, status: nextOrderStatus(o.status) } : o
      ),
    }));
  }

  function handleMessage(order: Order) {
    if (!order.phone.trim()) {
      toast.warning("No phone number on this order.");
      return;
    }
    window.open(
      buildWhatsAppLink(order.phone, buildOrderStatusMessage(order, db.settings)),
      "_blank"
    );
  }

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

  function handleReturnSubmit(input: ReturnInput) {
    setDB((prev) => applyNewReturn(prev, input));
    toast.success("Return recorded — stock updated");
    setReturnTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Orders</h1>
      <DuesAlert orders={db.orders} onRemind={handleRemind} />
      <OrderForm
        key={editingOrder ? editingOrder.id : `new-${formKey}`}
        stock={db.stock}
        editingOrder={editingOrder}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingId(null)}
      />
      <OrdersTable
        orders={db.orders}
        onEdit={(order) => {
          setEditingId(order.id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={handleDelete}
        onCycleStatus={handleCycleStatus}
        onMessage={handleMessage}
        onReturn={(order) => setReturnTarget(order)}
      />
      <QuickReturnDialog
        order={returnTarget}
        stock={db.stock}
        onOpenChange={(open) => !open && setReturnTarget(null)}
        onSubmit={handleReturnSubmit}
      />
    </div>
  );
}
