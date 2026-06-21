"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReturnForm } from "@/components/returns/return-form";
import type { ReturnInput } from "@/lib/returns";
import type { Order, StockItem } from "@/lib/types";

interface QuickReturnDialogProps {
  order: Order | null;
  stock: StockItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ReturnInput) => void;
}

export function QuickReturnDialog({
  order,
  stock,
  onOpenChange,
  onSubmit,
}: QuickReturnDialogProps) {
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Return this order</DialogTitle>
              <DialogDescription>
                Adjust quantity and refund details, then save — stock is added back
                automatically.
              </DialogDescription>
            </DialogHeader>
            <ReturnForm
              key={order.id}
              stock={stock}
              initialValues={{
                name: order.name,
                phone: order.phone,
                stockCode: order.stockCode,
                product: order.product,
                qty: String(order.qty),
                amount: String(order.price * order.qty),
                origin: order.channel,
              }}
              onSubmit={onSubmit}
              submitLabel="Save Return"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
