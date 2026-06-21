"use client";

import { useState, type FormEvent } from "react";
import { Save, Plus } from "lucide-react";
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
import { ORDER_CHANNELS, ORDER_STATUSES, PAYMENT_MODES } from "@/lib/constants";
import { findStockByCode } from "@/lib/codes";
import { formatCurrency, todayISO } from "@/lib/format";
import type { OrderInput } from "@/lib/orders";
import type { Order, StockItem } from "@/lib/types";

interface OrderFormProps {
  stock: StockItem[];
  editingOrder: Order | null;
  onSubmit: (input: OrderInput) => void;
  onCancelEdit: () => void;
}

export function OrderForm({ stock, editingOrder, onSubmit, onCancelEdit }: OrderFormProps) {
  const isEditing = !!editingOrder;
  const [name, setName] = useState(editingOrder?.name ?? "");
  const [phone, setPhone] = useState(editingOrder?.phone ?? "");
  const [channel, setChannel] = useState(editingOrder?.channel ?? ORDER_CHANNELS[0]);
  const [date, setDate] = useState(editingOrder?.date ?? todayISO());
  const [status, setStatus] = useState(editingOrder?.status ?? ORDER_STATUSES[0]);
  const [stockCode, setStockCode] = useState(editingOrder?.stockCode ?? "");
  const [product, setProduct] = useState(editingOrder?.product ?? "");
  const [price, setPrice] = useState(editingOrder ? String(editingOrder.price) : "");
  const [cost, setCost] = useState(editingOrder ? String(editingOrder.cost) : "");
  const [qty, setQty] = useState(editingOrder ? String(editingOrder.qty) : "1");
  const [payMode, setPayMode] = useState(editingOrder?.payMode ?? PAYMENT_MODES[0]);
  const [amountPaid, setAmountPaid] = useState(
    editingOrder && editingOrder.payMode === "Partial/Due" ? String(editingOrder.paidAmount) : ""
  );
  const [notify, setNotify] = useState(editingOrder?.notify ?? false);

  function handleStockSelect(code: string) {
    setStockCode(code);
    const match = findStockByCode(stock, code);
    if (match) {
      setProduct(match.name);
      setPrice(String(match.sell));
      setCost(String(match.cost));
    }
  }

  const total = (Number(price) || 0) * (Number(qty) || 0);
  const dueAmount =
    payMode === "Partial/Due" ? Math.max(0, total - (Number(amountPaid) || 0)) : 0;

  const canSubmit = name.trim() !== "" && stockCode.trim() !== "" && Number(qty) > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      date,
      name: name.trim(),
      phone: phone.trim(),
      channel,
      status,
      stockCode,
      product: product.trim(),
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      qty: Number(qty) || 0,
      payMode,
      amountPaid: Number(amountPaid) || 0,
      notify,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Order" : "New Order"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update this order's details."
            : "Selecting a stock item fills in product, price, and cost."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-name">Customer name</Label>
              <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-phone">Phone</Label>
              <Input
                id="order-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => v && setChannel(v)}>
                <SelectTrigger id="order-channel" className="w-full">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-date">Date</Label>
              <Input id="order-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <Label htmlFor="order-stock">Stock item</Label>
              <Select value={stockCode} onValueChange={(v) => v && handleStockSelect(v)}>
                <SelectTrigger id="order-stock" className="w-full">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {stock.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No stock items yet — add some in Stock.
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
              <Label htmlFor="order-status">Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger id="order-status" className="w-full">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-qty">Quantity</Label>
              <Input
                id="order-qty"
                type="number"
                inputMode="numeric"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-product">Product</Label>
              <Input id="order-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-price">Sell price / pc</Label>
              <Input
                id="order-price"
                type="number"
                inputMode="decimal"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-cost">Cost / pc</Label>
              <Input
                id="order-cost"
                type="number"
                inputMode="decimal"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-paymode">Payment Mode</Label>
              <Select value={payMode} onValueChange={(v) => v && setPayMode(v)}>
                <SelectTrigger id="order-paymode" className="w-full">
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
            </div>
            {payMode === "Partial/Due" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
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
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Amount Due</Label>
                  <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm font-medium text-destructive">
                    {formatCurrency(dueAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="order-notify" checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
            <Label htmlFor="order-notify">Notify customer on WhatsApp</Label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4 text-base font-semibold text-brand-maroon-dark">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {isEditing && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!canSubmit}>
            {isEditing ? (
              <>
                <Save className="size-4" />
                Save changes
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Save Order
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
