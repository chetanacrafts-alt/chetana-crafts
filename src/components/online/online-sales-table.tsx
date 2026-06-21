"use client";

import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { downloadCSV } from "@/lib/csv";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import type { OnlineSale } from "@/lib/types";

interface OnlineSalesTableProps {
  sales: OnlineSale[];
  onDelete: (id: string) => void;
}

export function OnlineSalesTable({ sales, onDelete }: OnlineSalesTableProps) {
  const sorted = [...sales].sort((a, b) => b.date.localeCompare(a.date));

  function handleExport() {
    downloadCSV(
      `chetana-online-sales-${todayISO()}.csv`,
      sorted.map((s) => ({
        Date: s.date,
        Platform: s.platform,
        OrderID: s.orderid,
        Product: s.product,
        StockCode: s.stockCode,
        Qty: s.qty,
        Value: s.value,
        Fee: s.fee,
        Shipping: s.shipping,
        Cost: s.cost,
        Payout: s.payout,
        Status: s.status,
      }))
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Online Sales</CardTitle>
          <CardDescription>
            {sales.length} sale{sales.length === 1 ? "" : "s"} logged
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={sorted.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No online sales recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{formatDate(s.date)}</TableCell>
                  <TableCell>
                    {s.platform}
                    {s.orderid && <p className="text-xs text-muted-foreground">{s.orderid}</p>}
                  </TableCell>
                  <TableCell>
                    {s.product}
                    <span className="text-xs text-muted-foreground"> ×{s.qty}</span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(s.value)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(s.payout)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.status}</TableCell>
                  <TableCell>
                    <DeleteOnlineSaleButton sale={s} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteOnlineSaleButton({
  sale,
  onDelete,
}: {
  sale: OnlineSale;
  onDelete: (id: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
        <Trash2 className="size-3.5 text-destructive" />
        <span className="sr-only">Delete</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the online sale and restores {sale.qty} unit
            {sale.qty === 1 ? "" : "s"} of {sale.product} back to stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(sale.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
