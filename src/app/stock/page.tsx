"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { StockForm } from "@/components/stock/stock-form";
import { StockTable } from "@/components/stock/stock-table";
import type { StockItem } from "@/lib/types";

export default function StockPage() {
  const { db, setDB, initialSyncAttempted } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const editingItem = editingId
    ? db.stock.find((s) => s.id === editingId) ?? null
    : null;

  function handleSubmit(item: StockItem) {
    setDB((prev) => ({
      ...prev,
      stock: editingId
        ? prev.stock.map((s) => (s.id === editingId ? item : s))
        : [...prev.stock, item],
    }));
    toast.success(editingId ? "Stock item updated" : "Stock item added");
    setEditingId(null);
    setFormKey((k) => k + 1);
  }

  function handleDelete(id: string) {
    setDB((prev) => ({ ...prev, stock: prev.stock.filter((s) => s.id !== id) }));
    toast.success("Stock item deleted");
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Stock</h1>
      <StockForm
        key={editingItem ? editingItem.id : `new-${formKey}`}
        stock={db.stock}
        editingItem={editingItem}
        ready={initialSyncAttempted}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingId(null)}
      />
      <StockTable
        stock={db.stock}
        onEdit={(item) => {
          setEditingId(item.id);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
