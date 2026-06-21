"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import type { StockItem } from "@/lib/types";

export interface BillLineRow {
  uid: string;
  code: string;
  name: string;
  qty: string;
  price: string;
}

interface BillItemRowProps {
  row: BillLineRow;
  stock: StockItem[];
  onChange: (row: BillLineRow) => void;
  onRemove: () => void;
  disableRemove: boolean;
}

export function BillItemRow({
  row,
  stock,
  onChange,
  onRemove,
  disableRemove,
}: BillItemRowProps) {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = row.code.trim().toLowerCase();
    if (!q) return [];
    return stock
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [stock, row.code]);

  function selectMatch(s: StockItem) {
    onChange({ ...row, code: s.code, name: s.name, price: String(s.sell) });
    setOpen(false);
  }

  const lineTotal = (Number(row.qty) || 0) * (Number(row.price) || 0);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 items-end rounded-lg border border-border p-3">
      <div className="relative col-span-2 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Code</Label>
        <Input
          value={row.code}
          onChange={(e) => {
            onChange({ ...row, code: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          placeholder="Optional"
          autoComplete="off"
        />
        {open && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-md">
            {matches.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMatch(s);
                }}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">
                  {s.code} · {s.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(s.sell)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-2 sm:col-span-2">
        <Label className="text-xs text-muted-foreground">Item</Label>
        <Input
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="Item name"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Qty</Label>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          value={row.qty}
          onChange={(e) => onChange({ ...row, qty: e.target.value })}
          placeholder="0"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Price</Label>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          value={row.price}
          onChange={(e) => onChange({ ...row, price: e.target.value })}
          placeholder="0"
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="font-medium">{formatCurrency(lineTotal)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disableRemove}
        >
          <Trash2 className="size-4 text-destructive" />
          <span className="sr-only">Remove item</span>
        </Button>
      </div>
    </div>
  );
}
