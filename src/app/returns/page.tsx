"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/context/data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReturnForm } from "@/components/returns/return-form";
import { ReturnsTable } from "@/components/returns/returns-table";
import { applyNewReturn, removeReturn, type ReturnInput } from "@/lib/returns";

export default function ReturnsPage() {
  const { db, setDB } = useData();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(input: ReturnInput) {
    setDB((prev) => applyNewReturn(prev, input));
    toast.success("Return recorded — stock updated");
    setFormKey((k) => k + 1);
  }

  function handleDelete(id: string) {
    setDB((prev) => removeReturn(prev, id));
    toast.success("Return deleted — stock adjusted back");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium sm:text-3xl">Returns</h1>
      <Card>
        <CardHeader>
          <CardTitle>Record Return</CardTitle>
          <CardDescription>
            Returned quantity is added back to stock automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReturnForm key={formKey} stock={db.stock} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
      <ReturnsTable returns={db.returns} onDelete={handleDelete} />
    </div>
  );
}
