"use client";

import { useState } from "react";
import { useRecordWaste, useWasteLogs } from "@/hooks/domains/useInventoryQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, History } from "lucide-react";
import { filterActive, updateLineItem } from "@/lib/form";
import type { Ingredient, WasteLineItem, Branch } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { DataTable } from "@/components/shared/data-table";
import { HubCard } from "@/components/shared/hub-card";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { formatDateTime } from "@/lib/intl-date";
import {
  formLineRowClassName,
  formPanelClassName,
  formPanelHeaderClassName,
  formRemoveButtonClassName,
  hubDangerActionClassName,
  metricValueClassName,
  text,
} from "@/lib/theme";

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

  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchId)?.name;

  const {
    data: wasteLogs = [],
    isLoading: logsLoading,
    isError: logsError,
    error: logsErr,
    refetch: refetchLogs,
    isFetching: logsFetching,
  } = useWasteLogs(branchId);
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
      <div className={formPanelClassName()}>
        <div className={formPanelHeaderClassName()}>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${text.primary}`}>
            <Trash2 className={`w-5 h-5 ${metricValueClassName("red")}`} />
            Record Waste
          </h2>
          <p className={`text-sm ${text.muted}`}>
            Record spoiled items, spillages, or staff consumption. Stock will be
            deducted immediately.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className={formLineRowClassName()}>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`waste-ingredient-${idx}`}>Ingredient</Label>
                <Select
                  value={item.ingredientId === 0 ? "" : String(item.ingredientId)}
                  onValueChange={(value) => {
                    if (value == null) return;
                    handleChange(idx, "ingredientId", Number(value));
                  }}
                >
                  <SelectTrigger id={`waste-ingredient-${idx}`} className="w-full">
                    <SelectValue placeholder="Select ingredient…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={String(ing.id)}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32 space-y-2">
                <Label htmlFor={`waste-quantity-${idx}`}>Quantity</Label>
                <Input
                  id={`waste-quantity-${idx}`}
                  name={`waste-quantity-${idx}`}
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
                <Label htmlFor={`waste-reason-${idx}`}>Reason</Label>
                <Input
                  id={`waste-reason-${idx}`}
                  name={`waste-reason-${idx}`}
                  type="text"
                  placeholder="e.g. Expired, Spilled"
                  value={item.reason}
                  onChange={(e) => handleChange(idx, "reason", e.target.value)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className={formRemoveButtonClassName("h-10 w-10")}
                aria-label="Remove line"
                onClick={() => handleRemoveItem(idx)}
                disabled={items.length === 1}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
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
            className={hubDangerActionClassName()}
            disabled={recordWasteMutation.isPending}
          >
            {recordWasteMutation.isPending
              ? "Recording…"
              : "Confirm Waste Deduction"}
          </Button>
        </div>
      </div>

      <HubCard
        title="Waste History"
        icon={History}
        description="Recent waste entries for this branch."
      >
        <ListToolbar branchName={branchName} />
        <DataTable
          loading={logsLoading}
          isError={logsError}
          errorMessage={getErrorMessage(logsErr, "Failed to load waste logs")}
          onRetry={() => void refetchLogs()}
          retryLoading={logsFetching}
          rowKey="id"
          dataSource={wasteLogs}
          columns={[
            {
              title: "Date",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (v: string) =>
                formatDateTime(v),
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
