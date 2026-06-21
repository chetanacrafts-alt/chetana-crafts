"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { BillForm } from "@/components/bill/bill-form";
import { BillPreviewDialog } from "@/components/bill/bill-preview-dialog";
import { findStockByCode } from "@/lib/codes";
import { genId } from "@/lib/id";
import { round2, formatCurrency } from "@/lib/format";
import { buildBillMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import type { BillPayload } from "@/lib/billing";
import type { Order } from "@/lib/types";

export default function BillPage() {
  const { db, setDB, initialSyncAttempted } = useData();
  const [formKey, setFormKey] = useState(0);
  const [previewPayload, setPreviewPayload] = useState<BillPayload | null>(null);
  const [previewCommitted, setPreviewCommitted] = useState(false);

  function commitBill(payload: BillPayload) {
    setDB((prev) => {
      let stock = [...prev.stock];
      const subtotal = payload.totals.subtotal;

      const newOrders: Order[] = payload.items.map((item) => {
        const matched = item.code ? findStockByCode(stock, item.code) : undefined;
        if (matched) {
          stock = stock.map((s) =>
            s.id === matched.id ? { ...s, qty: s.qty - item.qty } : s
          );
        }

        const lineAmount = item.qty * item.price;
        const share = subtotal > 0 ? lineAmount / subtotal : 1 / payload.items.length;

        return {
          id: genId(),
          billNo: payload.billNo,
          date: payload.date,
          name: payload.customer.name,
          phone: payload.customer.phone,
          channel: "Bill",
          product: item.name,
          price: item.price,
          cost: matched?.cost ?? 0,
          qty: item.qty,
          status: "Completed",
          stockCode: matched?.code ?? item.code,
          payMode: payload.paymentMode,
          paidAmount: round2(payload.totals.paidAmount * share),
          dueAmount: round2(payload.totals.dueAmount * share),
          notify: payload.notify,
        };
      });

      return { ...prev, stock, orders: [...prev.orders, ...newOrders] };
    });
  }

  function notifySavedToast(payload: BillPayload) {
    toast.success(
      payload.totals.dueAmount > 0
        ? `Order saved — ${formatCurrency(payload.totals.dueAmount)} due`
        : "Order saved"
    );
  }

  function handlePreview(payload: BillPayload) {
    setPreviewPayload(payload);
    setPreviewCommitted(false);
  }

  // Triggered by the form's own "Save as Order" button — saves immediately and
  // auto-notifies via WhatsApp if the checkbox is ticked.
  function handleSaveOrder(payload: BillPayload) {
    commitBill(payload);
    notifySavedToast(payload);

    if (payload.notify) {
      if (payload.customer.phone.trim()) {
        window.open(
          buildWhatsAppLink(payload.customer.phone, buildBillMessage(payload, db.settings)),
          "_blank"
        );
      } else {
        toast.warning("Add a phone number to notify the customer on WhatsApp.");
      }
    }

    setPreviewPayload(null);
    setFormKey((k) => k + 1);
  }

  // Triggered from inside the Preview dialog by either Download PDF or Send on
  // WhatsApp — whichever happens first commits the order. Idempotent, so
  // clicking both buttons (or the same one twice) never double-saves.
  function ensurePreviewSaved(payload: BillPayload) {
    if (previewCommitted) return;
    commitBill(payload);
    setPreviewCommitted(true);
    notifySavedToast(payload);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Bill</h1>
      <BillForm
        key={formKey}
        stock={db.stock}
        orders={db.orders}
        ready={initialSyncAttempted}
        onPreview={handlePreview}
        onSave={handleSaveOrder}
      />
      <BillPreviewDialog
        payload={previewPayload}
        settings={db.settings}
        committed={previewCommitted}
        onEnsureSaved={ensurePreviewSaved}
        onOpenChange={(open) => !open && setPreviewPayload(null)}
      />
    </div>
  );
}
