"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_CHANNELS, REFUND_MODES } from "@/lib/constants";
import { findStockByCode } from "@/lib/codes";
import { todayISO } from "@/lib/format";
import type { ReturnInput } from "@/lib/returns";
import type { StockItem } from "@/lib/types";

export interface ReturnFormValues {
  name: string;
  phone: string;
  stockCode: string;
  product: string;
  qty: string;
  amount: string;
  reason: string;
  refundMode: string;
  origin: string;
}

interface ReturnFormProps {
  stock: StockItem[];
  initialValues?: Partial<ReturnFormValues>;
  onSubmit: (input: ReturnInput) => void;
  submitLabel?: string;
}

export function ReturnForm({ stock, initialValues, onSubmit, submitLabel }: ReturnFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [stockCode, setStockCode] = useState(initialValues?.stockCode ?? "");
  const [product, setProduct] = useState(initialValues?.product ?? "");
  const [qty, setQty] = useState(initialValues?.qty ?? "1");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [reason, setReason] = useState(initialValues?.reason ?? "");
  const [refundMode, setRefundMode] = useState(initialValues?.refundMode ?? REFUND_MODES[0]);
  const [origin, setOrigin] = useState(initialValues?.origin ?? ORDER_CHANNELS[0]);
  const [amountEdited, setAmountEdited] = useState(false);

  function handleStockSelect(code: string) {
    setStockCode(code);
    const match = findStockByCode(stock, code);
    if (match) {
      setProduct(match.name);
      if (!amountEdited) setAmount(String(match.sell * (Number(qty) || 1)));
    }
  }

  function handleQtyChange(value: string) {
    setQty(value);
    if (!amountEdited) {
      const match = findStockByCode(stock, stockCode);
      if (match) setAmount(String(match.sell * (Number(value) || 0)));
    }
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    setAmountEdited(true);
  }

  const canSubmit = name.trim() !== "" && product.trim() !== "" && Number(qty) > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      date: todayISO(),
      name: name.trim(),
      phone: phone.trim(),
      stockCode,
      product: product.trim(),
      qty: Number(qty) || 0,
      amount: Number(amount) || 0,
      reason: reason.trim(),
      refundMode,
      origin,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-name">Customer name</Label>
          <Input id="return-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-phone">Phone</Label>
          <Input
            id="return-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-stock">Stock item</Label>
          <Select value={stockCode} onValueChange={(v) => v && handleStockSelect(v)}>
            <SelectTrigger id="return-stock" className="w-full">
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              {stock.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No stock items yet.
                </div>
              ) : (
                stock.map((s) => (
                  <SelectItem key={s.id} value={s.code}>
                    {s.code} · {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-product">Product</Label>
          <Input id="return-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product name" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-qty">Quantity</Label>
          <Input
            id="return-qty"
            type="number"
            inputMode="numeric"
            min="0"
            value={qty}
            onChange={(e) => handleQtyChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-amount">Refund amount</Label>
          <Input
            id="return-amount"
            type="number"
            inputMode="decimal"
            min="0"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="return-reason">Reason</Label>
        <Input
          id="return-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Wrong size, damaged, etc."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-refundmode">Refund Mode</Label>
          <Select value={refundMode} onValueChange={(v) => v && setRefundMode(v)}>
            <SelectTrigger id="return-refundmode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFUND_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-origin">Origin</Label>
          <Select value={origin} onValueChange={(v) => v && setOrigin(v)}>
            <SelectTrigger id="return-origin" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          <Save className="size-4" />
          {submitLabel ?? "Save Return"}
        </Button>
      </div>
    </form>
  );
}
