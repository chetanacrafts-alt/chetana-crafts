"use client";

import { useMemo, useState } from "react";
import { Download, MessageCircle, Pencil, Search, Trash2, Undo2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StatusBadge } from "@/components/orders/status-badge";
import { ORDER_STATUSES } from "@/lib/constants";
import { downloadCSV } from "@/lib/csv";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import type { Order } from "@/lib/types";

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (order: Order) => void;
  onMessage: (order: Order) => void;
  onReturn: (order: Order) => void;
}

export function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onCycleStatus,
  onMessage,
  onReturn,
}: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All statuses");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = orders;
    if (statusFilter !== "All statuses") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (q) {
      list = list.filter((o) =>
        [o.name, o.product, o.phone].some((f) => f.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, search, statusFilter]);

  function handleExport() {
    downloadCSV(
      `chetana-orders-${todayISO()}.csv`,
      filtered.map((o) => ({
        Date: o.date,
        Customer: o.name,
        Phone: o.phone,
        Channel: o.channel,
        Product: o.product,
        StockCode: o.stockCode,
        Qty: o.qty,
        Price: o.price,
        Total: o.price * o.qty,
        PayMode: o.payMode,
        Paid: o.paidAmount,
        Due: o.dueAmount,
        Status: o.status,
      }))
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {orders.length} order{orders.length === 1 ? "" : "s"} logged
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, product, phone"
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All statuses">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No orders yet — add your first one above.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No orders match your search/filter.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-muted-foreground">{formatDate(order.date)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{order.name}</p>
                    {order.phone && <p className="text-xs text-muted-foreground">{order.phone}</p>}
                  </TableCell>
                  <TableCell>
                    {order.product}
                    <span className="text-xs text-muted-foreground"> ×{order.qty}</span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.price * order.qty)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{order.payMode}</span>
                      {order.dueAmount > 0 && (
                        <span className="inline-flex w-fit items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          DUE {formatCurrency(order.dueAmount)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} onClick={() => onCycleStatus(order)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMessage(order)}>
                        <MessageCircle className="size-3.5" />
                        <span className="sr-only">Message customer</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(order)}>
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => onReturn(order)}>
                        <Undo2 className="size-3.5" />
                        <span className="sr-only">Return</span>
                      </Button>
                      <DeleteOrderButton order={order} onDelete={onDelete} />
                    </div>
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

function DeleteOrderButton({
  order,
  onDelete,
}: {
  order: Order;
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
          <AlertDialogTitle>Delete this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the order for &ldquo;{order.name}&rdquo; and restores {order.qty}{" "}
            unit{order.qty === 1 ? "" : "s"} of {order.product} back to stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(order.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
