"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Download, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadBillPDF } from "@/lib/pdf";
import { buildBillMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BillPayload } from "@/lib/billing";
import type { BusinessSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BillPreviewDialogProps {
  payload: BillPayload | null;
  settings: BusinessSettings;
  committed: boolean;
  onEnsureSaved: (payload: BillPayload) => void;
  onOpenChange: (open: boolean) => void;
}

export function BillPreviewDialog({
  payload,
  settings,
  committed,
  onEnsureSaved,
  onOpenChange,
}: BillPreviewDialogProps) {
  const businessName = settings.name || "Chetana Crafts";
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (!payload) return;
    onEnsureSaved(payload);
    setGeneratingPdf(true);
    try {
      await downloadBillPDF(payload, settings);
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleSendWhatsApp() {
    if (!payload) return;
    onEnsureSaved(payload);
    window.open(
      buildWhatsAppLink(payload.customer.phone, buildBillMessage(payload, settings)),
      "_blank"
    );
  }

  return (
    <Dialog open={!!payload} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {payload && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Bill preview</DialogTitle>
            </DialogHeader>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-10 shrink-0 items-center justify-center">
                  <Image
                    src="/logo-icon.png"
                    alt={businessName}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </span>
                <div>
                  <p className="font-heading text-base font-medium text-brand-maroon-dark">
                    {businessName}
                  </p>
                  {settings.addr && (
                    <p className="text-xs text-muted-foreground">{settings.addr}</p>
                  )}
                  {(settings.phone || settings.gstin) && (
                    <p className="text-xs text-muted-foreground">
                      {[settings.phone && `Ph: ${settings.phone}`, settings.gstin && `GSTIN: ${settings.gstin}`]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    payload.billType === "GST"
                      ? "bg-brand-maroon text-brand-cream"
                      : "bg-brand-gold text-brand-maroon-dark"
                  )}
                >
                  {payload.billType === "GST" ? "GST Tax Invoice" : "Cash Bill"}
                </span>
                <span className="text-xs text-muted-foreground">{payload.billNo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Bill To</p>
                <p className="font-medium">{payload.customer.name}</p>
                {payload.customer.phone && (
                  <p className="text-sm text-muted-foreground">{payload.customer.phone}</p>
                )}
                {payload.customer.addr && (
                  <p className="text-sm text-muted-foreground">{payload.customer.addr}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(payload.date)}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-brand-maroon hover:bg-brand-maroon">
                  <TableHead className="text-brand-cream">Item</TableHead>
                  <TableHead className="text-right text-brand-cream">Qty</TableHead>
                  <TableHead className="text-right text-brand-cream">Price</TableHead>
                  <TableHead className="text-right text-brand-cream">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payload.items.map((it, i) => (
                  <TableRow key={`${it.code}-${i}`} className={i % 2 === 1 ? "bg-brand-cream/60" : ""}>
                    <TableCell>
                      {it.name}
                      {it.code && (
                        <span className="ml-1 text-xs text-muted-foreground">({it.code})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{it.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(it.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(it.qty * it.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(payload.totals.subtotal)}</span>
              </div>
              {payload.totals.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatCurrency(payload.totals.discountAmount)}</span>
                </div>
              )}
              {payload.billType === "GST" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST ({payload.gstRate / 2}%)</span>
                    <span>{formatCurrency(payload.totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST ({payload.gstRate / 2}%)</span>
                    <span>{formatCurrency(payload.totals.sgst)}</span>
                  </div>
                </>
              )}
              <div className="mt-1 flex items-center justify-between rounded-lg bg-brand-maroon px-4 py-2.5 text-brand-cream">
                <span className="font-semibold">TOTAL</span>
                <span className="text-lg font-bold">{formatCurrency(payload.totals.grandTotal)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="font-medium">{payload.paymentMode}</span>
              </div>
              {payload.paymentMode === "Partial/Due" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{formatCurrency(payload.totals.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-destructive">
                    <span>Due</span>
                    <span>{formatCurrency(payload.totals.dueAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-sm font-medium text-brand-maroon-dark italic">
              Thank you for shopping with {businessName}!
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              {committed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" />
                  Saved to Orders
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Saves to Orders automatically when you download or send.
                </span>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadPdf} disabled={generatingPdf}>
                  <Download className="size-4" />
                  {generatingPdf ? "Generating…" : "Download PDF"}
                </Button>
                <Button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={!payload.customer.phone.trim()}
                >
                  <MessageCircle className="size-4" />
                  Send on WhatsApp
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
