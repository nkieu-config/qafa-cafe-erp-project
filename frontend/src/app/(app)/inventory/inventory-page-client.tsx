"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBranchInventory } from "@/hooks/domains/useInventoryQueries";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { Package, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { HubCard, HubPageHeader } from "@/components/shared/hub-card";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import {
  stockLevel,
  stockLevelIconClassName,
  stockLevelStatusTone,
  stockLevelValueClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

import type { BranchInventory, Branch } from "@/types/api";

type InventoryRow = BranchInventory & { ingredient?: { name: string; unit: string } };
type StockFilter = "ALL" | "ok" | "low" | "out";

export default function InventoryBalancePage() {
  const { activeBranchId } = useAuth();
  const { data: branches = [] } = useBranches();
  const branchId = activeBranchId ? Number(activeBranchId) : undefined;
  const branchName = (branches as Branch[]).find((b) => b.id === branchId)?.name;
  const {
    data: inventoryData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useBranchInventory(activeBranchId || undefined);
  const inventory = inventoryData || [];

  const searchParams = useSearchParams();
  const lowFromUrl = searchParams.get("filter") === "low";
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [stockFilter, setStockFilter] = useState<StockFilter>(lowFromUrl ? "low" : "ALL");

  useEffect(() => {
    if (searchParams.get("filter") === "low") setStockFilter("low");
  }, [searchParams]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((record: InventoryRow) => {
      const level = stockLevel(record.stock, record.minStock);
      const matchesLevel =
        stockFilter === "ALL" ||
        level === stockFilter ||
        (stockFilter === "low" && level === "out");
      const name = record.ingredient?.name?.toLowerCase() ?? "";
      const matchesSearch = !debouncedSearch || name.includes(debouncedSearch);
      return matchesLevel && matchesSearch;
    });
  }, [inventory, debouncedSearch, stockFilter]);

  const hasActiveFilters = search.trim().length > 0 || stockFilter !== "ALL";

  if (!activeBranchId) {
    return <BranchEmptyState description="Select a branch in the top bar to view stock balances." />;
  }

  return (
    <>
      <HubPageHeader
        title="Branch Stock Balance"
        icon={Package}
        description="Current aggregate stock for all raw ingredients."
      />
      <HubCard hideTitle>
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ingredients…"
        branchName={branchName}
        showReset={hasActiveFilters}
        onReset={() => {
          setSearch("");
          setStockFilter("ALL");
        }}
        filters={
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className={cn(
              "min-h-[44px] rounded-md border px-3 text-sm",
              "border-[var(--border)] bg-[var(--table-container-bg)] text-[var(--foreground)]",
            )}
            aria-label="Filter by stock level"
          >
            <option value="ALL">All levels</option>
            <option value="ok">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        }
      />
      <DataTable
        loading={isLoading}
        isError={isError}
        errorMessage={getErrorMessage(error, "Failed to load inventory")}
        onRetry={() => void refetch()}
        retryLoading={isFetching}
        emptyDescription={
          hasActiveFilters
            ? "No ingredients match your filters."
            : "No inventory records for this branch yet."
        }
        hideBorders
        columns={[
          {
            title: "Ingredient Name",
            key: "name",
            render: (_: unknown, record: InventoryRow) => (
              <span className={`font-medium ${text.primary}`}>{record.ingredient?.name}</span>
            ),
          },
          {
            title: "Stock Balance",
            key: "stock",
            render: (_: unknown, record: InventoryRow) => {
              const level = stockLevel(record.stock, record.minStock);
              return (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  {level !== "ok" ? (
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${stockLevelIconClassName(level)}`} aria-hidden />
                  ) : null}
                  <span className={stockLevelValueClassName(level)}>
                    {record.stock.toFixed(2)}
                  </span>
                  {level === "out" ? (
                    <span className={`text-xs font-semibold ${stockLevelValueClassName("out")}`}>Out</span>
                  ) : level === "low" ? (
                    <span className={`text-xs font-semibold ${stockLevelValueClassName("low")}`}>Low</span>
                  ) : null}
                </span>
              );
            },
          },
          {
            title: "Unit",
            key: "unit",
            render: (_: unknown, record: InventoryRow) => (
              <span className={tableCellMutedClassName()}>{record.ingredient?.unit}</span>
            ),
          },
          {
            title: "Status",
            key: "status",
            render: (_: unknown, record: InventoryRow) => {
              const level = stockLevel(record.stock, record.minStock);
              const tone = stockLevelStatusTone(level);
              const label = level === "out" ? "Out of Stock" : level === "low" ? "Low Stock" : "In Stock";
              return (
                <StatusBadge tone={tone} className="flex items-center gap-1 w-fit">
                  {level !== "ok" ? <AlertTriangle className="w-3 h-3" aria-hidden /> : null}
                  {label}
                </StatusBadge>
              );
            },
          },
        ]}
        dataSource={filteredInventory}
        rowKey="id"
        pagination={{ pageSize: 15 }}
      />
      </HubCard>
    </>
  );
}
