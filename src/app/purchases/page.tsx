"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import {
  PurchaseForm,
  type PurchaseSubmission,
} from "@/components/purchases/purchase-form";
import { PurchaseHistory } from "@/components/purchases/purchase-history";
import { nextStockCode, findStockByCode, resolveVariantCode } from "@/lib/codes";
import { genId } from "@/lib/id";
import type { Expense, Purchase, PurchaseItem, StockItem } from "@/lib/types";

export default function PurchasesPage() {
  const { db, setDB } = useData();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(data: PurchaseSubmission) {
    setDB((prev) => {
      let stock = [...prev.stock];
      const purchaseItems: PurchaseItem[] = [];
      let total = 0;

      for (const article of data.articles) {
        const isMulti = article.variants.length > 1;
        let baseCode = article.code.trim();

        article.variants.forEach((variant, idx) => {
          total += variant.qty * variant.cost;

          const typedCode = resolveVariantCode(baseCode, isMulti, variant.color, idx);
          const existing = typedCode ? findStockByCode(stock, typedCode) : undefined;
          let finalCode: string;

          if (existing) {
            stock = stock.map((s) =>
              s.id === existing.id ? { ...s, qty: s.qty + variant.qty } : s
            );
            finalCode = existing.code;
          } else {
            if (!baseCode) baseCode = nextStockCode(stock);
            finalCode = resolveVariantCode(baseCode, isMulti, variant.color, idx) || baseCode;
            const newItem: StockItem = {
              id: genId(),
              code: finalCode,
              name: article.name,
              cat: "Other",
              color: variant.color,
              source: data.supplier,
              cost: variant.cost,
              sell: variant.sell,
              qty: variant.qty,
              low: 2,
            };
            stock = [...stock, newItem];
          }

          purchaseItems.push({
            id: genId(),
            code: finalCode,
            name: article.name,
            color: variant.color,
            qty: variant.qty,
            cost: variant.cost,
            sell: variant.sell,
          });
        });
      }

      const purchase: Purchase = {
        id: genId(),
        date: data.date,
        supplier: data.supplier,
        city: data.city,
        items: purchaseItems,
        total,
        extra: data.tripCost,
        photo: data.photo,
      };

      const expenses: Expense[] = [
        ...prev.expenses,
        {
          id: genId(),
          date: data.date,
          name: `Stock purchase — ${data.supplier}`,
          amt: total,
          cat: "Stock Purchase",
        },
        ...(data.tripCost > 0
          ? [
              {
                id: genId(),
                date: data.date,
                name: `Travel — ${data.supplier}${data.city ? ", " + data.city : ""}`,
                amt: data.tripCost,
                cat: "Travel",
              },
            ]
          : []),
      ];

      return {
        ...prev,
        stock,
        purchases: [...prev.purchases, purchase],
        expenses,
      };
    });

    toast.success("Purchase recorded and stock updated");
    setFormKey((k) => k + 1);
  }

  function handleDelete(id: string) {
    setDB((prev) => ({
      ...prev,
      purchases: prev.purchases.filter((p) => p.id !== id),
    }));
    toast.success("Purchase deleted");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Purchases</h1>
      <PurchaseForm key={formKey} stock={db.stock} onSubmit={handleSubmit} />
      <PurchaseHistory purchases={db.purchases} onDelete={handleDelete} />
    </div>
  );
}
