"use client";

import { useState } from "react";
import { useRecordWaste, useWasteLogs } from "@/hooks/domains/useInventoryQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, History } from "lucide-react";
import { filterActive, updateLineItem } from "@/lib/form";
import type { Ingredient, WasteLineItem } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { DataTable } from "@/components/shared/data-table";
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { format } from "date-fns";

const emptyLine = (): WasteLineItem => ({
  ingredientId: 0,
  quantity: 0,
  reason: "",
});

export default function WasteLogPage() {
  const { activeBranchId } = useAuth();
  const branchId = activeBranchId ? Number(activeBranchId) : undefined;

  const { data: ingredientsData } = useIngredients();
  const ingredients = filterActive((ingredientsData || []) as Ingredient[]);

  const { data: wasteLogs = [], isLoading: logsLoading } = useWasteLogs(branchId);
  const recordWasteMutation = useRecordWaste();

  const [items, setItems] = useState<WasteLineItem[]>([emptyLine()]);

  const handleAddItem = () => {
    setItems([...items, emptyLine()]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems.length ? newItems : [emptyLine()]);
  };

  const handleChange = <K extends keyof WasteLineItem>(
    index: number,
    field: K,
    value: WasteLineItem[K],
  ) => {
    setItems(updateLineItem(items, index, field, value));
  };

  const handleSubmit = async () => {
    if (!branchId) {
      toast.error("No active branch selected.");
      return;
    }

    const validItems = items.filter(
      (i) => i.ingredientId > 0 && i.quantity > 0 && i.reason.trim() !== "",
    );
    if (validItems.length === 0) {
      toast.error(
        "Please add at least one valid ingredient with quantity > 0 and a reason.",
      );
      return;
    }

    try {
      await recordWasteMutation.mutateAsync({
        branchId,
        items: validItems.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          reason: i.reason,
        })),
      });
      toast.success("Waste recorded successfully!");
      setItems([emptyLine()]);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err, "Failed to record waste. Not enough stock?"),
      );
    }
  };

  if (!branchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to record and view waste logs." />
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 max-w-4xl">
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Record Waste
          </h2>
          <p className="text-sm text-slate-500">
            Record spoiled items, spillages, or staff consumption. Stock will be
            deducted immediately.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
            >
              <div className="flex-1 space-y-2">
                <Label>Ingredient</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={item.ingredientId}
                  onChange={(e) =>
                    handleChange(idx, "ingredientId", Number(e.target.value))
                  }
                >
                  <option value={0}>Select ingredient...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-32 space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Qty"
                  value={item.quantity || ""}
                  onChange={(e) =>
                    handleChange(idx, "quantity", Number(e.target.value))
                  }
                />
              </div>

              <div className="w-64 space-y-2">
                <Label>Reason</Label>
                <Input
                  type="text"
                  placeholder="e.g. Expired, Spilled"
                  value={item.reason}
                  onChange={(e) => handleChange(idx, "reason", e.target.value)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-slate-400 hover:text-red-500"
                onClick={() => handleRemoveItem(idx)}
                disabled={items.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Another Row
          </Button>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={recordWasteMutation.isPending}
          >
            {recordWasteMutation.isPending
              ? "Recording..."
              : "Confirm Waste Deduction"}
          </Button>
        </div>
      </div>

      <HubCard
        title="Waste History"
        icon={History}
        description="Recent waste entries for this branch."
      >
        <DataTable
          loading={logsLoading}
          rowKey="id"
          dataSource={wasteLogs}
          columns={[
            {
              title: "Date",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (v: string) =>
                format(new Date(v), "dd MMM yyyy HH:mm"),
            },
            {
              title: "Ingredient",
              key: "ingredient",
              render: (_: unknown, row: (typeof wasteLogs)[number]) =>
                row.ingredient?.name ?? `#${row.ingredientId}`,
            },
            {
              title: "Qty",
              dataIndex: "quantity",
              key: "quantity",
              align: "right" as const,
              render: (qty: number, row: (typeof wasteLogs)[number]) => (
                <span className="font-mono tabular-nums">
                  {Number(qty).toFixed(2)} {row.ingredient?.unit ?? ""}
                </span>
              ),
            },
            {
              title: "Reason",
              dataIndex: "reason",
              key: "reason",
            },
            {
              title: "Recorded by",
              key: "recordedBy",
              render: (_: unknown, row: (typeof wasteLogs)[number]) =>
                row.recordedBy?.name ?? "-",
            },
          ]}
        />
      </HubCard>
    </div>
  );
}
