"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useBranchInventory,
  useRecordWaste,
  useWasteLogs,
} from "@/hooks/domains/useInventoryQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { useAuth } from "@/context/AuthContext";
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
import { Trash2, Plus, History, Loader2, LayoutGrid, ClipboardCheck } from "lucide-react";
import { filterActive, updateLineItem } from "@/lib/form";
import type { Ingredient, WasteLineItem, Branch, WasteLog } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { DataTable } from "@/components/shared/data-table";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterDate, ListFilterRow, ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateTime } from "@/lib/intl-date";
import {
  formFieldInsetClassName,
  formSelectContentClassName,
  listToolbarFieldClassName,
  formLineFieldClassName,
  formLineQtyFieldClassName,
  formLineReasonFieldClassName,
  formLineRowClassName,
  formPanelClassName,
  formPanelHeaderClassName,
  formRemoveButtonClassName,
  hubDangerActionClassName,
  inventorySectionPanelClassName,
  metricValueClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ColumnsType } from "antd/es/table";

type WasteLineRow = WasteLineItem & { rowId: string };

function emptyLine(): WasteLineRow {
  return {
    rowId: crypto.randomUUID(),
    ingredientId: 0,
    quantity: 0,
    reason: "",
  };
}

function duplicateIngredientIds(items: WasteLineRow[]): Set<number> {
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

function isLineDirty(item: WasteLineRow) {
  return (
    item.ingredientId > 0 ||
    item.quantity > 0 ||
    item.reason.trim().length > 0
  );
}

function logMatchesSearch(log: WasteLog, query: string) {
  const reason = log.reason.toLowerCase();
  const ingredient = log.ingredient?.name?.toLowerCase() ?? "";
  const recordedBy = log.recordedBy?.name?.toLowerCase() ?? "";
  return (
    reason.includes(query) ||
    ingredient.includes(query) ||
    recordedBy.includes(query)
  );
}

export default function WasteLogPage() {
  const router = useRouter();
  const { activeBranchId } = useAuth();
  const branchId = activeBranchId ? Number(activeBranchId) : undefined;

  const {
    data: ingredientsData,
    isLoading: ingredientsLoading,
    isError: ingredientsError,
    error: ingredientsErr,
    refetch: refetchIngredients,
    isFetching: ingredientsFetching,
  } = useIngredients();
  const ingredients = filterActive((ingredientsData || []) as Ingredient[]);

  const { data: inventoryData = [] } = useBranchInventory(branchId);
  const stockByIngredientId = useMemo(() => {
    const map = new Map<number, number>();
    for (const record of inventoryData) {
      map.set(record.ingredientId, record.stock);
    }
    return map;
  }, [inventoryData]);

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

  const [items, setItems] = useState<WasteLineRow[]>([emptyLine()]);
  const [historySearch, setHistorySearch] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const debouncedHistorySearch = useDebouncedValue(historySearch.trim().toLowerCase(), 300);

  const formDisabled =
    ingredientsLoading || ingredientsError || ingredients.length === 0;
  const duplicateIds = useMemo(() => duplicateIngredientIds(items), [items]);
  const validLineCount = useMemo(
    () =>
      items.filter(
        (i) => i.ingredientId > 0 && i.quantity > 0 && i.reason.trim() !== "",
      ).length,
    [items],
  );
  const isDirty = useMemo(() => items.some(isLineDirty), [items]);
  const submitDisabled =
    recordWasteMutation.isPending ||
    formDisabled ||
    validLineCount === 0 ||
    duplicateIds.size > 0;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !recordWasteMutation.isPending) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, recordWasteMutation.isPending]);

  const filteredLogs = useMemo(() => {
    return wasteLogs.filter((log: WasteLog) => {
      if (debouncedHistorySearch && !logMatchesSearch(log, debouncedHistorySearch)) {
        return false;
      }
      if (ingredientFilter !== "ALL" && log.ingredientId !== Number(ingredientFilter)) {
        return false;
      }
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (new Date(log.createdAt) < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        if (new Date(log.createdAt) > to) return false;
      }
      return true;
    });
  }, [wasteLogs, debouncedHistorySearch, ingredientFilter, dateFrom, dateTo]);

  const hasHistoryFilters =
    historySearch.trim().length > 0 ||
    ingredientFilter !== "ALL" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const historyIngredients = useMemo(() => {
    const seen = new Map<number, string>();
    for (const log of wasteLogs) {
      if (log.ingredient) {
        seen.set(log.ingredientId, log.ingredient.name);
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [wasteLogs]);

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

  const handleChange = <K extends keyof WasteLineItem>(
    index: number,
    field: K,
    value: WasteLineItem[K],
  ) => {
    setItems((prev) => updateLineItem(prev, index, field, value) as WasteLineRow[]);
  };

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved waste lines?")) return;
    router.push("/inventory");
  }, [isDirty, router]);

  const handleSubmit = async () => {
    if (!branchId) {
      toast.error("No active branch selected.");
      return;
    }

    if (duplicateIds.size > 0) {
      toast.error("Each ingredient can only appear once. Remove duplicate rows.");
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
          reason: i.reason.trim(),
        })),
      });
      toast.success("Waste recorded successfully!");
      setItems([emptyLine()]);
      void refetchLogs();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err, "Failed to record waste. Not enough stock?"),
      );
    }
  };

  const historyColumns = useMemo(
    () =>
      [
        {
          title: "Date",
          dataIndex: "createdAt",
          key: "createdAt",
          width: 140,
          responsive: ["md"],
          render: (v: string) => (
            <span className={cn("whitespace-nowrap tabular-nums text-sm", text.subtle)}>
              {formatDateTime(v)}
            </span>
          ),
        },
        {
          title: "Ingredient",
          key: "ingredient",
          render: (_: unknown, row: WasteLog) => (
            <div className="min-w-0">
              <span className={cn("font-medium", text.primary)}>
                {row.ingredient?.name ?? `#${row.ingredientId}`}
              </span>
              <p className={cn("mt-0.5 text-xs md:hidden", text.muted)}>
                {formatDateTime(row.createdAt)}
              </p>
            </div>
          ),
        },
        {
          title: "Qty",
          dataIndex: "quantity",
          key: "quantity",
          align: "right" as const,
          width: 96,
          render: (qty: number, row: WasteLog) => (
            <span className={cn("font-mono tabular-nums text-sm", text.subtle)}>
              {Number(qty).toFixed(2)}
              {row.ingredient?.unit ? (
                <span className={cn("ml-1 text-xs", text.muted)}>{row.ingredient.unit}</span>
              ) : null}
            </span>
          ),
        },
        {
          title: "Reason",
          dataIndex: "reason",
          key: "reason",
          responsive: ["sm"],
          render: (reason: string) => (
            <span className={text.secondary}>{reason}</span>
          ),
        },
        {
          title: "Recorded by",
          key: "recordedBy",
          responsive: ["lg"],
          render: (_: unknown, row: WasteLog) => (
            <span className={tableCellMutedClassName()}>
              {row.recordedBy?.name ?? "—"}
            </span>
          ),
        },
      ] as ColumnsType<WasteLog>,
    [],
  );

  if (!branchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to record and view waste logs." />
    );
  }

  return (
    <div className="space-y-8">
      <HubPageHeader
        hideTitle
        icon={Trash2}
        accentHub="inventory"
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
            <Trash2 className={cn("w-5 h-5", metricValueClassName("red"))} aria-hidden />
            Record Waste
          </h2>
          <p className={cn("text-sm mt-1", text.muted)}>
            Record spoiled items, spillages, or staff consumption. Stock will be deducted
            immediately from branch totals.
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
              Add raw ingredients in Products before recording waste.{" "}
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
            const stockOnHand =
              item.ingredientId > 0
                ? stockByIngredientId.get(item.ingredientId)
                : undefined;
            const selectedIngredient = ingredients.find((ing) => ing.id === item.ingredientId);

            return (
              <div key={item.rowId} className={formLineRowClassName()}>
                <div className={formLineFieldClassName()}>
                  <Label htmlFor={`waste-ingredient-${item.rowId}`} className={text.secondary}>
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
                      id={`waste-ingredient-${item.rowId}`}
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
                  {item.ingredientId > 0 && stockOnHand !== undefined ? (
                    <p className={cn("text-xs mt-1", text.muted)}>
                      Stock on hand:{" "}
                      <span className={cn("font-medium tabular-nums", text.secondary)}>
                        {stockOnHand.toFixed(2)} {selectedIngredient?.unit ?? ""}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className={formLineQtyFieldClassName()}>
                  <Label htmlFor={`waste-quantity-${item.rowId}`} className={text.secondary}>
                    Quantity
                  </Label>
                  <Input
                    id={`waste-quantity-${item.rowId}`}
                    name={`waste-quantity-${item.rowId}`}
                    className={formFieldInsetClassName("h-11")}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Qty"
                    value={item.quantity || ""}
                    disabled={formDisabled}
                    onChange={(e) =>
                      handleChange(idx, "quantity", Number(e.target.value))
                    }
                  />
                </div>

                <div className={formLineReasonFieldClassName()}>
                  <Label htmlFor={`waste-reason-${item.rowId}`} className={text.secondary}>
                    Reason
                  </Label>
                  <Input
                    id={`waste-reason-${item.rowId}`}
                    name={`waste-reason-${item.rowId}`}
                    className={formFieldInsetClassName("h-11")}
                    type="text"
                    placeholder="e.g. Expired, Spilled"
                    value={item.reason}
                    disabled={formDisabled}
                    onChange={(e) => handleChange(idx, "reason", e.target.value)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className={formRemoveButtonClassName(
                    "min-h-[44px] min-w-[44px] h-11 w-11 self-end",
                  )}
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
              {validLineCount} line{validLineCount === 1 ? "" : "s"} ready to record
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
              className={hubDangerActionClassName("min-h-[44px]")}
              disabled={submitDisabled}
            >
              {recordWasteMutation.isPending ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                  Recording…
                </>
              ) : (
                "Confirm Waste Deduction"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className={inventorySectionPanelClassName()}>
        <div className={formPanelHeaderClassName("mb-4")}>
          <h2 className={cn("text-lg font-bold flex items-center gap-2", text.primary)}>
            <History className={cn("w-5 h-5", metricValueClassName("slate"))} aria-hidden />
            Waste History
          </h2>
          <p className={cn("text-sm mt-1", text.muted)}>
            Recent waste entries for this branch.
          </p>
        </div>

        <HubListPage>
        <HubListPage.Error
          message={
            logsError ? getErrorMessage(logsErr, "Failed to load waste logs") : undefined
          }
          onRetry={() => void refetchLogs()}
          loading={logsFetching}
        />

        <HubListPage.Toolbar
          search={historySearch}
          onSearchChange={setHistorySearch}
          searchPlaceholder="Search reason, ingredient, or recorder…"
          showReset={hasHistoryFilters}
          onReset={() => {
            setHistorySearch("");
            setIngredientFilter("ALL");
            setDateFrom("");
            setDateTo("");
          }}
          filters={
            <ListFilterRow>
              <ListFilterSelect
                value={ingredientFilter}
                onValueChange={setIngredientFilter}
                ariaLabel="Filter by ingredient"
                widthClassName="w-full sm:w-[200px]"
                options={[
                  { value: "ALL", label: "All ingredients" },
                  ...historyIngredients.map((ing) => ({
                    value: String(ing.id),
                    label: ing.name,
                  })),
                ]}
              />
              <ListFilterDate
                value={dateFrom}
                onChange={setDateFrom}
                ariaLabel="Filter from date"
              />
              <ListFilterDate
                value={dateTo}
                onChange={setDateTo}
                ariaLabel="Filter to date"
                min={dateFrom || undefined}
              />
            </ListFilterRow>
          }
        />

        <HubListPage.Count
          isLoading={logsLoading}
          isError={logsError}
          isFetching={logsFetching}
          hasActiveFilters={hasHistoryFilters}
          filteredCount={filteredLogs.length}
          totalCount={wasteLogs.length}
          itemLabel="entry"
          itemLabelPlural="entries"
          emptyLabel="No waste recorded yet"
        />

        <DataTable
          loading={logsLoading}
          isError={logsError}
          errorMessage={getErrorMessage(logsErr, "Failed to load waste logs")}
          onRetry={() => void refetchLogs()}
          retryLoading={logsFetching}
          rowKey="id"
          dataSource={filteredLogs}
          columns={historyColumns}
          hideBorders
          scroll={{ x: undefined }}
          emptyDescription={
            hasHistoryFilters
              ? "No waste logs match your filters."
              : "No waste entries recorded for this branch yet."
          }
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
        />
        </HubListPage>
      </div>
    </div>
  );
}
