"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Eye, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedToggle } from "@/components/segmented-toggle";
import { BillItemRow, type BillLineRow } from "@/components/bill/bill-item-row";
import { PAYMENT_MODES } from "@/lib/constants";
import { genId } from "@/lib/id";
import { todayISO, formatCurrency } from "@/lib/format";
import {
  computeBillTotals,
  generateBillNo,
  hasGstRateWarning,
  type BillPayload,
  type BillType,
  type DiscountMode,
} from "@/lib/billing";
import type { StockItem } from "@/lib/types";

function emptyRow(): BillLineRow {
  return { uid: genId(), code: "", name: "", qty: "", price: "" };
}

interface BillFormProps {
  stock: StockItem[];
  onPreview: (payload: BillPayload) => void;
  onSave: (payload: BillPayload) => void;
}

export function BillForm({ stock, onPreview, onSave }: BillFormProps) {
  // Empty on the initial (server-matching) render, filled in after mount —
  // generateBillNo() uses Math.random(), so computing it during the render
  // that SSR also produces would cause a hydration mismatch.
  const [billNo, setBillNo] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only random value, see comment above
    setBillNo(generateBillNo());
  }, []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [billType, setBillType] = useState<BillType>("GST");
  const [gstRate, setGstRate] = useState<"5" | "12">("5");
  const [rows, setRows] = useState<BillLineRow[]>([emptyRow()]);
  const [discountValue, setDiscountValue] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("flat");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [notify, setNotify] = useState(false);

  function updateRow(uid: string, next: BillLineRow) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? next : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(uid: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.uid !== uid) : prev));
  }

  const items = rows
    .filter((r) => r.name.trim() && Number(r.qty) > 0)
    .map((r) => ({
      code: r.code.trim(),
      name: r.name.trim(),
      qty: Number(r.qty) || 0,
      price: Number(r.price) || 0,
    }));

  const totals = computeBillTotals({
    billType,
    gstRate: Number(gstRate),
    items,
    discountValue: Number(discountValue) || 0,
    discountMode,
    paymentMode,
    amountPaid: Number(amountPaid) || 0,
  });

  const gstWarning = hasGstRateWarning(billType, Number(gstRate), items);
  const canSubmit = name.trim() !== "" && items.length > 0;

  function buildPayload(): BillPayload {
    return {
      billNo,
      date: todayISO(),
      customer: { name: name.trim(), phone: phone.trim(), addr: addr.trim() },
      billType,
      gstRate: Number(gstRate),
      items,
      discountValue: Number(discountValue) || 0,
      discountMode,
      paymentMode,
      amountPaid: Number(amountPaid) || 0,
      notify,
      totals,
    };
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>New Bill</CardTitle>
          <CardDescription>
            Build a GST tax invoice or a simple cash bill for a customer.
          </CardDescription>
        </div>
        {billNo && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {billNo}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-name">Customer name</Label>
            <Input id="bill-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-phone">Phone</Label>
            <Input
              id="bill-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98XXXXXXXX"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-addr">Address</Label>
            <Input
              id="bill-addr"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Address (optional)"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Bill Type</Label>
            <SegmentedToggle
              options={[
                { value: "GST", label: "GST Invoice" },
                { value: "Cash", label: "Cash Bill" },
              ]}
              value={billType}
              onChange={setBillType}
            />
          </div>
          {billType === "GST" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">GST Rate</Label>
              <SegmentedToggle
                options={[
                  { value: "5", label: "5%" },
                  { value: "12", label: "12%" },
                ]}
                value={gstRate}
                onChange={setGstRate}
              />
            </div>
          )}
        </div>

        {gstWarning && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/15 px-3 py-2 text-sm text-brand-maroon-dark">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              One or more items are priced over ₹1,000 — these may require 12% GST
              instead of 5% under standard textile slabs.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Label>Items</Label>
          {rows.map((row) => (
            <BillItemRow
              key={row.uid}
              row={row}
              stock={stock}
              onChange={(next) => updateRow(row.uid, next)}
              onRemove={() => removeRow(row.uid)}
              disableRemove={rows.length === 1}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
            <Plus className="size-4" />
            Add item
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-discount">Discount</Label>
            <div className="flex gap-2">
              <Input
                id="bill-discount"
                type="number"
                inputMode="decimal"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
              />
              <SegmentedToggle
                size="sm"
                options={[
                  { value: "flat", label: "₹" },
                  { value: "percent", label: "%" },
                ]}
                value={discountMode}
                onChange={setDiscountMode}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-paymode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(v) => v && setPaymentMode(v)}>
              <SelectTrigger id="bill-paymode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentMode === "Partial/Due" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Amount Paid</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Amount Due</Label>
                  <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm font-medium text-destructive">
                    {formatCurrency(totals.dueAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="bill-notify" checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
          <Label htmlFor="bill-notify">Notify customer on WhatsApp</Label>
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          {billType === "GST" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST ({Number(gstRate) / 2}%)</span>
                <span>{formatCurrency(totals.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST ({Number(gstRate) / 2}%)</span>
                <span>{formatCurrency(totals.sgst)}</span>
              </div>
            </>
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold text-brand-maroon-dark">
            <span>Total</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" disabled={!canSubmit} onClick={() => onPreview(buildPayload())}>
          <Eye className="size-4" />
          Preview
        </Button>
        <Button type="button" disabled={!canSubmit} onClick={() => onSave(buildPayload())}>
          <Save className="size-4" />
          Save as Order
        </Button>
      </CardFooter>
    </Card>
  );
}
