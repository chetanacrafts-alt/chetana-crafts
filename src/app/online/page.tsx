"use client";

import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { OnlineSaleForm } from "@/components/online/online-sale-form";
import { OnlineSalesTable } from "@/components/online/online-sales-table";
import { applyOnlineSale, buildOnlineSaleFromInput, removeOnlineSale, type OnlineSaleInput } from "@/lib/online";

export default function OnlineSalesPage() {
  const { db, setDB } = useData();

  function handleSubmit(input: OnlineSaleInput) {
    const sale = buildOnlineSaleFromInput(input);
    setDB((prev) => applyOnlineSale(prev, sale));
    toast.success("Online sale recorded");
  }

  function handleDelete(id: string) {
    setDB((prev) => removeOnlineSale(prev, id));
    toast.success("Online sale deleted — stock restored");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Online Sales</h1>
      <OnlineSaleForm stock={db.stock} onSubmit={handleSubmit} />
      <OnlineSalesTable sales={db.online} onDelete={handleDelete} />
    </div>
  );
}
