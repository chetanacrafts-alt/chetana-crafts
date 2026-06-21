"use client";

import { useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { Purchase } from "@/lib/types";

interface PurchaseHistoryProps {
  purchases: Purchase[];
  onDelete: (id: string) => void;
}

export function PurchaseHistory({ purchases, onDelete }: PurchaseHistoryProps) {
  const sorted = [...purchases].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>
          {purchases.length} purchase{purchases.length === 1 ? "" : "s"} logged
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No purchases recorded yet.
          </p>
        ) : (
          sorted.map((p) => <PurchaseRow key={p.id} purchase={p} onDelete={onDelete} />)
        )}
      </CardContent>
    </Card>
  );
}

function PurchaseRow({
  purchase,
  onDelete,
}: {
  purchase: Purchase;
  onDelete: (id: string) => void;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const pieceCount = purchase.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {purchase.supplier}
            {purchase.city ? ` · ${purchase.city}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(purchase.date)} · {pieceCount} pc across {purchase.items.length}{" "}
            item{purchase.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(purchase.total)}</p>
          {purchase.extra > 0 && (
            <p className="text-xs text-muted-foreground">
              + {formatCurrency(purchase.extra)} travel
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {purchase.items.map((it) => (
          <span
            key={it.id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            <ColorDot name={it.color} />
            {it.code} · {it.name} ×{it.qty}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {purchase.photo && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setPhotoOpen(true)}>
              <ImageIcon className="size-4" />
              View Bill
            </Button>
            <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bill — {purchase.supplier}</DialogTitle>
                </DialogHeader>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={purchase.photo}
                  alt={`Bill from ${purchase.supplier}`}
                  className="max-h-[70vh] w-full rounded-md object-contain"
                />
              </DialogContent>
            </Dialog>
          </>
        )}
        <DeletePurchaseButton purchase={purchase} onDelete={onDelete} />
      </div>
    </div>
  );
}

function DeletePurchaseButton({
  purchase,
  onDelete,
}: {
  purchase: Purchase;
  onDelete: (id: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" size="sm" className="text-destructive" />}
      >
        <Trash2 className="size-4" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the purchase record from history. Stock quantities
            and expenses it already logged are not reversed automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(purchase.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
