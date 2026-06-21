"use client";

import { Trash2 } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { ReturnItem } from "@/lib/types";

interface ReturnsTableProps {
  returns: ReturnItem[];
  onDelete: (id: string) => void;
}

export function ReturnsTable({ returns, onDelete }: ReturnsTableProps) {
  const sorted = [...returns].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns</CardTitle>
        <CardDescription>
          {returns.length} return{returns.length === 1 ? "" : "s"} logged
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No returns recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Refund Mode</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                  </TableCell>
                  <TableCell>
                    {r.product}
                    {r.stockCode && (
                      <span className="text-xs text-muted-foreground"> ({r.stockCode})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.refundMode}</TableCell>
                  <TableCell>
                    <DeleteReturnButton item={r} onDelete={onDelete} />
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

function DeleteReturnButton({
  item,
  onDelete,
}: {
  item: ReturnItem;
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
          <AlertDialogTitle>Delete this return?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the return record and takes {item.qty} unit
            {item.qty === 1 ? "" : "s"} of {item.product} back out of stock.
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
