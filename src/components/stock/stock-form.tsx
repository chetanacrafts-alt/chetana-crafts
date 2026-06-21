"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save, Plus } from "lucide-react";
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
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { STOCK_CATEGORIES } from "@/lib/constants";
import { nextStockCode, isDuplicateCode } from "@/lib/codes";
import { genId } from "@/lib/id";
import type { StockItem } from "@/lib/types";

interface StockFormProps {
  stock: StockItem[];
  editingItem: StockItem | null;
  ready: boolean;
  onSubmit: (item: StockItem) => void;
  onCancelEdit: () => void;
}

// The parent must remount this component (via a changing `key`) whenever
// it should reset — e.g. after a successful add, or when switching which
// item is being edited. See app/stock/page.tsx.
export function StockForm({
  stock,
  editingItem,
  ready,
  onSubmit,
  onCancelEdit,
}: StockFormProps) {
  const isEditing = !!editingItem;
  const [code, setCode] = useState(editingItem?.code ?? nextStockCode(stock));
  const [codeEdited, setCodeEdited] = useState(false);

  // The suggested code is computed from whatever `stock` is available at
  // mount, which on a fresh device/session can still be the (empty) local
  // cache before the initial sync pull resolves — re-deriving here once real
  // data arrives avoids suggesting an already-used code. Skipped once the
  // user types their own code, or while editing an existing item.
  useEffect(() => {
    if (isEditing || codeEdited) return;
    setCode(nextStockCode(stock));
  }, [stock, isEditing, codeEdited]);

  const [name, setName] = useState(editingItem?.name ?? "");
  const [cat, setCat] = useState<string>(editingItem?.cat ?? STOCK_CATEGORIES[0]);
  const [color, setColor] = useState(editingItem?.color ?? "");
  const [source, setSource] = useState(editingItem?.source ?? "");
  const [cost, setCost] = useState(editingItem ? String(editingItem.cost) : "");
  const [sell, setSell] = useState(editingItem ? String(editingItem.sell) : "");
  const [qty, setQty] = useState(editingItem ? String(editingItem.qty) : "");
  const [low, setLow] = useState(editingItem ? String(editingItem.low) : "2");

  const duplicate = isDuplicateCode(stock, code, editingItem?.id);
  // For a brand-new item, the suggested code depends on `stock` already
  // reflecting the server — block save until the initial sync has at least
  // been attempted, so a fresh device can't silently create a duplicate code.
  // Editing an existing item carries no such risk.
  const canSubmit = name.trim() !== "" && !duplicate && (isEditing || ready);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      id: editingItem?.id ?? genId(),
      code: code.trim() || nextStockCode(stock),
      name: name.trim(),
      cat,
      color,
      source: source.trim(),
      cost: Number(cost) || 0,
      sell: Number(sell) || 0,
      qty: Number(qty) || 0,
      low: Number(low) || 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? `Edit ${editingItem.code}` : "Add Stock Item"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update this item's details."
            : "New items are added to your inventory."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-code">Item code</Label>
            <Input
              id="stock-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeEdited(true);
              }}
              placeholder="CC-001"
            />
            {duplicate && (
              <p className="text-xs text-destructive">
                Code already used by another item.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-name">Name</Label>
            <Input
              id="stock-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bandhani Chaniya Choli"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-cat">Category</Label>
            <Select value={cat} onValueChange={(v) => v && setCat(v)}>
              <SelectTrigger id="stock-cat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <Label>Colour</Label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-source">Source</Label>
            <Input
              id="stock-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Supplier / market"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-cost">Cost / pc</Label>
            <Input
              id="stock-cost"
              type="number"
              inputMode="decimal"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-sell">Sell / pc</Label>
            <Input
              id="stock-sell"
              type="number"
              inputMode="decimal"
              min="0"
              value={sell}
              onChange={(e) => setSell(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-qty">Quantity</Label>
            <Input
              id="stock-qty"
              type="number"
              inputMode="numeric"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-low">Low-stock alert</Label>
            <Input
              id="stock-low"
              type="number"
              inputMode="numeric"
              min="0"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              placeholder="2"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {isEditing && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!canSubmit}>
            {!isEditing && !ready ? (
              "Checking…"
            ) : isEditing ? (
              <>
                <Save className="size-4" />
                Save changes
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add to Stock
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
