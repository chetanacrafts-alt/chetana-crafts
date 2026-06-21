"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ONLINE_PLATFORMS, ORDER_STATUSES } from "@/lib/constants";
import { findStockByCode } from "@/lib/codes";
import { formatCurrency, todayISO } from "@/lib/format";
import type { OnlineSaleInput } from "@/lib/online";
import type { StockItem } from "@/lib/types";

interface OnlineSaleFormProps {
  stock: StockItem[];
  onSubmit: (input: OnlineSaleInput) => void;
}

export function OnlineSaleForm({ stock, onSubmit }: OnlineSaleFormProps) {
  const [date, setDate] = useState(todayISO());
  const [platform, setPlatform] = useState<string>(ONLINE_PLATFORMS[0]);
  const [orderid, setOrderid] = useState("");
  const [stockCode, setStockCode] = useState("");
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [value, setValue] = useState("");
  const [fee, setFee] = useState("");
  const [shipping, setShipping] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState<string>(ORDER_STATUSES[0]);
  const [valueEdited, setValueEdited] = useState(false);
  const [costEdited, setCostEdited] = useState(false);

  function handleStockSelect(code: string) {
    setStockCode(code);
    const match = findStockByCode(stock, code);
    if (match) {
      setProduct(match.name);
      if (!costEdited) setCost(String(match.cost * (Number(qty) || 1)));
      if (!valueEdited) setValue(String(match.sell * (Number(qty) || 1)));
    }
  }

  function handleQtyChange(next: string) {
    setQty(next);
    const match = findStockByCode(stock, stockCode);
    if (match) {
      if (!costEdited) setCost(String(match.cost * (Number(next) || 0)));
      if (!valueEdited) setValue(String(match.sell * (Number(next) || 0)));
    }
  }

  function handleValueChange(next: string) {
    setValue(next);
    setValueEdited(true);
  }

  function handleCostChange(next: string) {
    setCost(next);
    setCostEdited(true);
  }

  const payout = Math.max(0, (Number(value) || 0) - (Number(fee) || 0) - (Number(shipping) || 0));
  const canSubmit = product.trim() !== "" && stockCode.trim() !== "" && Number(qty) > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      date,
      platform,
      orderid: orderid.trim(),
      stockCode,
      product: product.trim(),
      qty: Number(qty) || 0,
      value: Number(value) || 0,
      fee: Number(fee) || 0,
      shipping: Number(shipping) || 0,
      cost: Number(cost) || 0,
      status,
    });
    setDate(todayISO());
    setOrderid("");
    setStockCode("");
    setProduct("");
    setQty("1");
    setValue("");
    setFee("");
    setShipping("");
    setCost("");
    setValueEdited(false);
    setCostEdited(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Online Sale</CardTitle>
        <CardDescription>
          Selecting a stock item fills in product, cost, and a suggested sale
          value. Payout is calculated automatically.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-date">Date</Label>
              <Input id="online-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-platform">Platform</Label>
              <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                <SelectTrigger id="online-platform" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ONLINE_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-orderid">Order ID</Label>
              <Input
                id="online-orderid"
                value={orderid}
                onChange={(e) => setOrderid(e.target.value)}
                placeholder="Platform order ID"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-status">Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger id="online-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <Label htmlFor="online-stock">Stock item</Label>
              <Select value={stockCode} onValueChange={(v) => v && handleStockSelect(v)}>
                <SelectTrigger id="online-stock" className="w-full">
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
              <Label htmlFor="online-qty">Quantity</Label>
              <Input
                id="online-qty"
                type="number"
                inputMode="numeric"
                min="0"
                value={qty}
                onChange={(e) => handleQtyChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="online-product">Product</Label>
            <Input id="online-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product name" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-value">Sale value</Label>
              <Input
                id="online-value"
                type="number"
                inputMode="decimal"
                min="0"
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-fee">Platform fee</Label>
              <Input
                id="online-fee"
                type="number"
                inputMode="decimal"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-shipping">Shipping</Label>
              <Input
                id="online-shipping"
                type="number"
                inputMode="decimal"
                min="0"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-cost">Cost</Label>
              <Input
                id="online-cost"
                type="number"
                inputMode="decimal"
                min="0"
                value={cost}
                onChange={(e) => handleCostChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4 text-base font-semibold text-brand-maroon-dark">
            <span>Net Payout</span>
            <span>{formatCurrency(payout)}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!canSubmit}>
            <Plus className="size-4" />
            Save Sale
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
