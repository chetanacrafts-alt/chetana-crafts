"use client";

import { useMemo, useState } from "react";
import { Download, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ColorDot } from "@/components/color-swatch-picker";
import { downloadCSV } from "@/lib/csv";
import { formatCurrency, marginPercent, todayISO } from "@/lib/format";
import type { StockItem } from "@/lib/types";

interface StockTableProps {
  stock: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
}

export function StockTable({ stock, onEdit, onDelete }: StockTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? stock
      : stock.filter((s) =>
          [s.name, s.code, s.color, s.cat].some((f) =>
            f.toLowerCase().includes(q)
          )
        );
    return [...list].sort((a, b) => a.code.localeCompare(b.code));
  }, [stock, search]);

  function handleExport() {
    downloadCSV(
      `chetana-stock-${todayISO()}.csv`,
      filtered.map((s) => ({
        Code: s.code,
        Name: s.name,
        Category: s.cat,
        Colour: s.color,
        Source: s.source,
        Cost: s.cost,
        Sell: s.sell,
        Qty: s.qty,
        LowAlert: s.low,
        MarginPercent: marginPercent(s.cost, s.sell)?.toFixed(1) ?? "",
      }))
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            {stock.length} item{stock.length === 1 ? "" : "s"} in stock
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, colour, category"
            className="pl-8"
          />
        </div>

        {stock.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No stock yet — add your first item above.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No items match &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Sell</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const low = item.qty <= item.low;
                const margin = marginPercent(item.cost, item.sell);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <ColorDot name={item.color} />
                    </TableCell>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.cat}
                    </TableCell>
                    <TableCell className="text-right">
                      {low ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          {item.qty}
                        </span>
                      ) : (
                        item.qty
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.sell)}
                    </TableCell>
                    <TableCell className="text-right">
                      {margin === null ? "—" : `${margin.toFixed(0)}%`}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <DeleteStockButton item={item} onDelete={onDelete} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteStockButton({
  item,
  onDelete,
}: {
  item: StockItem;
  onDelete: (id: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2 className="size-3.5 text-destructive" />
        <span className="sr-only">Delete</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item.code}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes &ldquo;{item.name}&rdquo; from your inventory. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(item.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
