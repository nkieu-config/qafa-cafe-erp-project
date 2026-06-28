"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStockIn } from "@/hooks/domains/useInventoryQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
import {
  ArrowDownToLine,
  Plus,
  Trash2,
  Loader2,
  LayoutGrid,
  ClipboardCheck,
  PackageOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { filterActive, updateLineItem } from "@/lib/form";
import type { Ingredient, StockLineItem, Branch } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  formFieldInsetClassName,
  formSelectContentClassName,
  formLineDateFieldClassName,
  formLineFieldClassName,
  formLineQtyFieldClassName,
  formLineRowClassName,
  formPanelClassName,
  formPanelHeaderClassName,
  formRemoveButtonClassName,
  hubCtaClassName,
  metricValueClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

type StockLineRow = StockLineItem & { rowId: string };

function emptyLine(): StockLineRow {
  return {
    rowId: crypto.randomUUID(),
    ingredientId: 0,
    quantity: 0,
    expiryDate: "",
  };
}

function duplicateIngredientIds(items: StockLineRow[]): Set<number> {
  const counts = new Map<number, number>();
  for (const item of items) {
    if (item.ingredientId > 0) {
      counts.set(item.ingredientId, (counts.get(item.ingredientId) ?? 0) + 1);
    }
  }
  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id),
  );
}

function isLineDirty(item: StockLineRow) {
  return item.ingredientId > 0 || item.quantity > 0 || (item.expiryDate?.trim().length ?? 0) > 0;
}

export default function StockInPage() {
  const { activeBranchId } = useAuth();
  const router = useRouter();
  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === activeBranchId)?.name;

  const {
    data: ingredientsData,
    isLoading: ingredientsLoading,
    isError: ingredientsError,
    error: ingredientsErr,
    refetch: refetchIngredients,
    isFetching: ingredientsFetching,
  } = useIngredients();
  const ingredients = filterActive((ingredientsData || []) as Ingredient[]);

  const stockInMutation = useStockIn();

  const [items, setItems] = useState<StockLineRow[]>([emptyLine()]);

  const formDisabled =
    ingredientsLoading || ingredientsError || ingredients.length === 0;
  const duplicateIds = useMemo(() => duplicateIngredientIds(items), [items]);
  const validLineCount = useMemo(
    () => items.filter((i) => i.ingredientId > 0 && i.quantity > 0).length,
    [items],
  );
  const isDirty = useMemo(() => items.some(isLineDirty), [items]);
  const submitDisabled =
    stockInMutation.isPending ||
    formDisabled ||
    validLineCount === 0 ||
    duplicateIds.size > 0;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !stockInMutation.isPending) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, stockInMutation.isPending]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, emptyLine()]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length ? next : [emptyLine()];
    });
  };

  const handleChange = <K extends keyof StockLineItem>(
    index: number,
    field: K,
    value: StockLineItem[K],
  ) => {
    setItems((prev) => updateLineItem(prev, index, field, value) as StockLineRow[]);
  };

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved receipt lines?")) return;
    router.push("/inventory");
  }, [isDirty, router]);

  const handleSubmit = async () => {
    if (!activeBranchId) {
      toast.error("No active branch selected.");
      return;
    }

    if (duplicateIds.size > 0) {
      toast.error("Each ingredient can only appear once. Remove duplicate rows.");
      return;
    }

    const validItems = items.filter((i) => i.ingredientId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid ingredient with quantity > 0.");
      return;
    }

    try {
      await stockInMutation.mutateAsync({
        branchId: activeBranchId,
        items: validItems.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : undefined,
        })),
      });
      toast.success("Stock received successfully!");
      router.push("/inventory/batches");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to receive stock"));
    }
  };

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to receive stock." />
    );
  }

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={ArrowDownToLine}
        accentHub="inventory"
        description="Record ad-hoc receipts not tied to a purchase order — e.g. direct delivery, central kitchen drop-off, or stock corrections. To receive against an approved PO, use Procurement → Purchase Orders → Receive."
        branchScope={{ branchName }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/inventory" variant="outline" className="font-medium">
              <LayoutGrid className="w-4 h-4 mr-2" aria-hidden />
              Stock overview
            </ButtonLink>
            <ButtonLink href="/inventory/batches" variant="outline" className="font-medium">
              <ClipboardCheck className="w-4 h-4 mr-2" aria-hidden />
              View batches
            </ButtonLink>
          </div>
        }
      />

      <div className={formPanelClassName()}>
        <div className={formPanelHeaderClassName()}>
          <h2 className={cn("text-lg font-bold flex items-center gap-2", text.primary)}>
            <ArrowDownToLine
              className={cn("w-5 h-5", metricValueClassName("emerald"))}
              aria-hidden
            />
            Receive Stock
          </h2>
          <p className={cn("text-sm mt-1", text.muted)}>
            Add one row per ingredient received. Expiry dates create trackable batches in
            Batches &amp; Expiry — recommended for perishable items.
          </p>
          {ingredientsFetching && !ingredientsLoading && (
            <span className={cn("inline-flex items-center gap-1.5 text-xs mt-2", text.muted)}>
              <Loader2
                className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              Updating ingredients…
            </span>
          )}
        </div>

        <HubListPage.Error
          message={
            ingredientsError
              ? getErrorMessage(ingredientsErr, "Failed to load ingredients")
              : undefined
          }
          onRetry={() => void refetchIngredients()}
          loading={ingredientsFetching}
          className="mb-4"
        />

        {!ingredientsLoading && !ingredientsError && ingredients.length === 0 && (
          <div
            className={cn(
              "mb-4 rounded-lg border p-4 text-sm",
              "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
              text.muted,
            )}
          >
            <p className={cn("font-medium", text.primary)}>No ingredients available</p>
            <p className="mt-1">
              Add raw ingredients in Products before receiving stock.{" "}
              <ButtonLink href="/products/ingredients" variant="link" className="h-auto p-0">
                Go to Raw Ingredients
              </ButtonLink>
            </p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item, idx) => {
            const isDuplicate =
              item.ingredientId > 0 && duplicateIds.has(item.ingredientId);
            return (
              <div key={item.rowId} className={formLineRowClassName()}>
                <div className={formLineFieldClassName()}>
                  <Label htmlFor={`grn-ingredient-${item.rowId}`} className={text.secondary}>
                    Ingredient
                  </Label>
                  <Select
                    value={item.ingredientId === 0 ? "" : String(item.ingredientId)}
                    onValueChange={(value) => {
                      if (value == null) return;
                      handleChange(idx, "ingredientId", Number(value));
                    }}
                    disabled={formDisabled}
                  >
                    <SelectTrigger
                      id={`grn-ingredient-${item.rowId}`}
                      className={formFieldInsetClassName("h-11 w-full")}
                    >
                      <SelectValue
                        placeholder={
                          ingredientsLoading ? "Loading ingredients…" : "Select ingredient…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className={formSelectContentClassName()}>
                      {ingredients.map((ing) => (
                        <SelectItem key={ing.id} value={String(ing.id)}>
                          {ing.name} ({ing.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isDuplicate ? (
                    <StatusBadge tone="warning" className="mt-1 w-fit">
                      Duplicate ingredient — combine into one row
                    </StatusBadge>
                  ) : null}
                </div>

                <div className={formLineQtyFieldClassName()}>
                  <Label htmlFor={`grn-quantity-${item.rowId}`} className={text.secondary}>
                    Quantity
                  </Label>
                  <Input
                    id={`grn-quantity-${item.rowId}`}
                    name={`grn-quantity-${item.rowId}`}
                    className={formFieldInsetClassName("h-11")}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    disabled={formDisabled}
                    onChange={(e) => handleChange(idx, "quantity", Number(e.target.value))}
                  />
                </div>

                <div className={formLineDateFieldClassName()}>
                  <Label htmlFor={`grn-expiry-${item.rowId}`} className={text.secondary}>
                    Expiry date
                  </Label>
                  <Input
                    id={`grn-expiry-${item.rowId}`}
                    name={`grn-expiry-${item.rowId}`}
                    className={formFieldInsetClassName("h-11")}
                    type="date"
                    value={item.expiryDate}
                    disabled={formDisabled}
                    onChange={(e) => handleChange(idx, "expiryDate", e.target.value)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={formRemoveButtonClassName("min-h-[44px] min-w-[44px] h-11 w-11 self-end")}
                  aria-label="Remove line"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length === 1 || formDisabled}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full min-h-[44px] border-dashed"
            disabled={formDisabled}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden /> Add Another Row
          </Button>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className={cn("text-sm sm:mr-auto space-y-1", text.muted)}>
            <p aria-live="polite">
              {validLineCount} line{validLineCount === 1 ? "" : "s"} ready to receive
            </p>
            {ingredientsError ? (
              <p className="text-[var(--status-warning-fg)]">
                Fix the ingredient load error above before confirming.
              </p>
            ) : null}
            {duplicateIds.size > 0 ? (
              <p className="text-[var(--status-warning-fg)]">
                Remove duplicate ingredients before confirming.
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              className={hubCtaClassName("inventory", "min-h-[44px]")}
              disabled={submitDisabled}
            >
              {stockInMutation.isPending ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                  Saving…
                </>
              ) : (
                <>
                  <PackageOpen className="w-4 h-4 mr-2" aria-hidden />
                  Confirm &amp; Receive Stock
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
