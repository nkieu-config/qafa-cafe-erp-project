"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBranchDetails, useReportWaste } from "@/hooks/domains/useInventoryQueries";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { PackageOpen, Trash2, ArrowDownToLine, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/button-link";
import {
  batchExpiryUrgency,
  expiryDateTextClassName,
  expiryUrgencyLabel,
  expiryUrgencyStatusTone,
  formSelectContentClassName,
  hubCtaClassName,
  inventorySectionPanelClassName,
  listToolbarFieldClassName,
  stockLevel,
  stockLevelLabel,
  stockLevelStatusTone,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import {
  countExpiredBatches,
  countExpiringBatches,
  isExpiredBatch,
  isExpiringBatch,
  isTrackableBatch,
} from "@/lib/inventory-alerts";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { getErrorMessage } from "@/lib/errors";
import { DataTable } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExpiryHeatmapPanel } from "@/components/inventory/ExpiryHeatmapPanel";
import { BatchWasteDialog } from "@/components/inventory/BatchWasteDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate } from "@/lib/intl-date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import { cn } from "@/lib/utils";
import type { ColumnsType } from "antd/es/table";
import type { Ingredient, InventoryBatch, PurchaseOrder, Supplier, BranchInventory, Branch, Role } from "@/types/api";

type InventoryWithIngredient = BranchInventory & { ingredient: Ingredient };
type BatchWithSupplier = InventoryBatch & {
  purchaseOrder?: PurchaseOrder & { supplier?: Supplier };
  ingredient?: Ingredient;
};

type ExpiryFilter = "ALL" | "expiring" | "expired";

function canReceiveStock(role: Role | undefined) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

function ingredientDisplayName(record: InventoryWithIngredient) {
  return record.ingredient?.name ?? `#${record.ingredientId}`;
}

function batchesForIngredient(batches: BatchWithSupplier[], ingredientId: number) {
  return batches.filter(
    (batch) => batch.ingredientId === ingredientId && isTrackableBatch(batch),
  );
}

function ingredientMatchesExpiryFilter(
  ingredientId: number,
  batches: BatchWithSupplier[],
  filter: ExpiryFilter,
) {
  if (filter === "ALL") return true;
  const ingredientBatches = batchesForIngredient(batches, ingredientId);
  if (filter === "expired") {
    return ingredientBatches.some(isExpiredBatch);
  }
  return ingredientBatches.some((batch) => isExpiringBatch(batch) && !isExpiredBatch(batch));
}

export default function InventoryBatchesPage() {
  const searchParams = useSearchParams();
  const expiringFromUrl = searchParams.get("filter") === "expiring";
  const { activeBranchId, user } = useAuth();
  const role = user?.role as Role | undefined;
  const showGrnAction = canReceiveStock(role);
  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === activeBranchId)?.name;

  const {
    data: branchDetails,
    isLoading: loadingBranch,
    isError: branchError,
    error: branchErr,
    refetch: refetchBranch,
    isFetching: branchFetching,
  } = useBranchDetails(activeBranchId ?? undefined);
  const inventories: InventoryWithIngredient[] = branchDetails?.inventories || [];
  const batches: BatchWithSupplier[] = branchDetails?.inventoryBatches || [];
  const trackableBatches = useMemo(() => batches.filter(isTrackableBatch), [batches]);

  const reportWasteMutation = useReportWaste();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>(
    expiringFromUrl ? "expiring" : "ALL",
  );

  useEffect(() => {
    if (searchParams.get("filter") === "expiring") setExpiryFilter("expiring");
  }, [searchParams]);

  const [wasteTarget, setWasteTarget] = useState<{
    batchId: number;
    ingredientId: number;
    maxQty: number;
    ingredientName: string;
  } | null>(null);
  const [wasteQty, setWasteQty] = useState("");
  const [wasteReason, setWasteReason] = useState("Expired");
  const [isWasteOpen, setIsWasteOpen] = useState(false);

  const batchSummary = useMemo(
    () => ({
      total: trackableBatches.length,
      expiring: countExpiringBatches(trackableBatches) - countExpiredBatches(trackableBatches),
      expired: countExpiredBatches(trackableBatches),
    }),
    [trackableBatches],
  );

  const filteredInventories = useMemo(() => {
    return inventories.filter((record) => {
      const name = record.ingredient?.name?.toLowerCase() ?? "";
      const matchesSearch = !debouncedSearch || name.includes(debouncedSearch);
      const matchesExpiry = ingredientMatchesExpiryFilter(
        record.ingredient.id,
        batches,
        expiryFilter,
      );
      return matchesSearch && matchesExpiry;
    });
  }, [inventories, debouncedSearch, expiryFilter, batches]);

  const hasActiveFilters = search.trim().length > 0 || expiryFilter !== "ALL";

  const openWasteDialog = (
    batchId: number,
    ingredientId: number,
    maxQty: number,
    ingredientName: string,
  ) => {
    setWasteTarget({ batchId, ingredientId, maxQty, ingredientName });
    setWasteQty(String(maxQty));
    setWasteReason("Expired");
    setIsWasteOpen(true);
  };

  const handleWasteSubmit = async () => {
    if (!wasteTarget || !activeBranchId) return;
    const qty = Number(wasteQty);
    if (isNaN(qty) || qty <= 0 || qty > wasteTarget.maxQty) {
      toast.error(`Enter a quantity between 0 and ${wasteTarget.maxQty}`);
      return;
    }
    if (!wasteReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    try {
      await reportWasteMutation.mutateAsync({
        branchId: activeBranchId,
        data: {
          batchId: wasteTarget.batchId,
          ingredientId: wasteTarget.ingredientId,
          quantity: qty,
          reason: wasteReason.trim(),
        },
      });
      toast.success("Waste reported successfully.");
      setIsWasteOpen(false);
      setWasteTarget(null);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const inventoryColumns = [
    {
      title: "Ingredient Name",
      key: "name",
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) =>
        ingredientDisplayName(a).localeCompare(ingredientDisplayName(b)),
      render: (_: unknown, record: InventoryWithIngredient) => (
        <div className={`font-bold ${text.primary}`}>{ingredientDisplayName(record)}</div>
      ),
    },
    {
      title: "Current Stock",
      key: "stock",
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) => a.stock - b.stock,
      render: (_: unknown, record: InventoryWithIngredient) => (
        <span className="tabular-nums font-mono">
          {Number(record.stock).toFixed(2)} {record.ingredient.unit}
        </span>
      ),
    },
    {
      title: "Min Stock",
      key: "minStock",
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) => a.minStock - b.minStock,
      render: (_: unknown, record: InventoryWithIngredient) => (
        <span className={cn("tabular-nums font-mono", tableCellMutedClassName())}>
          {Number(record.minStock).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Batches",
      key: "batches",
      render: (_: unknown, record: InventoryWithIngredient) => {
        const ingredientBatches = batchesForIngredient(batches, record.ingredient.id);
        const expiringCount = ingredientBatches.filter(
          (batch) => isExpiringBatch(batch) && !isExpiredBatch(batch),
        ).length;
        const expiredCount = ingredientBatches.filter(isExpiredBatch).length;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("tabular-nums text-sm", text.secondary)}>
              {ingredientBatches.length} batch{ingredientBatches.length === 1 ? "" : "es"}
            </span>
            {expiringCount > 0 ? (
              <StatusBadge tone="warning">{expiringCount} expiring</StatusBadge>
            ) : null}
            {expiredCount > 0 ? (
              <StatusBadge tone="danger">{expiredCount} expired</StatusBadge>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) => {
        const order = { out: 0, low: 1, ok: 2 };
        return (
          order[stockLevel(a.stock, a.minStock)] - order[stockLevel(b.stock, b.minStock)]
        );
      },
      render: (_: unknown, record: InventoryWithIngredient) => {
        const level = stockLevel(record.stock, record.minStock);
        return (
          <StatusBadge tone={stockLevelStatusTone(level)}>{stockLevelLabel(level)}</StatusBadge>
        );
      },
    },
  ];

  const expandedRowRender = (record: InventoryWithIngredient) => {
    const ingredientId = record.ingredient.id;
    const ingredientBatches = batchesForIngredient(batches, ingredientId);

    const batchColumns: ColumnsType<BatchWithSupplier> = [
      {
        title: "Batch ID",
        dataIndex: "id",
        key: "id",
        responsive: ["md"],
      },
      {
        title: "Supplier",
        key: "supplier",
        responsive: ["lg"],
        render: (_: unknown, b: BatchWithSupplier) => (
          <span>{b.purchaseOrder?.supplier?.name || "—"}</span>
        ),
      },
      {
        title: "Qty",
        key: "quantity",
        render: (_: unknown, b: BatchWithSupplier) => (
          <span className="tabular-nums font-mono font-medium">
            {Number(b.quantity).toFixed(2)} {record.ingredient.unit}
          </span>
        ),
      },
      {
        title: "Expiry",
        key: "expiryDate",
        render: (_: unknown, b: BatchWithSupplier) => {
          if (!b.expiryDate) return <span className={`text-xs ${text.muted}`}>No expiry</span>;
          const urgency = batchExpiryUrgency(b.expiryDate);
          const showBadge = urgency && urgency !== "safe";
          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className={expiryDateTextClassName(urgency)}>{formatDate(b.expiryDate)}</span>
              {showBadge && urgency ? (
                <StatusBadge tone={expiryUrgencyStatusTone(urgency)}>
                  {expiryUrgencyLabel(urgency)}
                </StatusBadge>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Action",
        key: "action",
        render: (_: unknown, b: BatchWithSupplier) => (
          <TableActionButton
            icon={Trash2}
            label="Report waste"
            iconOnly
            destructive
            onClick={() =>
              openWasteDialog(
                b.id,
                b.ingredientId,
                b.quantity,
                ingredientDisplayName(record),
              )
            }
          />
        ),
      },
    ];

    return (
      <DataTable
        columns={batchColumns}
        dataSource={ingredientBatches}
        rowKey="id"
        pagination={false}
        size="small"
        hideBorders
        scroll={{ x: undefined }}
        emptyDescription="No active batches for this ingredient."
      />
    );
  };

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to manage batches and expiry." />
    );
  }

  return (
    <div className="w-full space-y-6">
      <HubPageHeader
        hideTitle
        icon={PackageOpen}
        accentHub="inventory"
        branchScope={{ branchName }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/inventory" variant="outline" className="font-medium">
              <LayoutGrid className="w-4 h-4 mr-2" aria-hidden />
              Stock overview
            </ButtonLink>
            {showGrnAction && (
              <ButtonLink href="/inventory/stock-in" className={hubCtaClassName("inventory", "font-bold")}>
                <ArrowDownToLine className="w-4 h-4 mr-2" aria-hidden />
                Receive stock
              </ButtonLink>
            )}
          </div>
        }
      />

      <BatchWasteDialog
        open={isWasteOpen}
        onOpenChange={setIsWasteOpen}
        ingredientName={wasteTarget?.ingredientName ?? null}
        maxQty={wasteTarget?.maxQty ?? null}
        quantity={wasteQty}
        onQuantityChange={setWasteQty}
        reason={wasteReason}
        onReasonChange={setWasteReason}
        onSubmit={() => void handleWasteSubmit()}
        isPending={reportWasteMutation.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpiryHeatmapPanel batches={batches} />
        </div>

        <HubListPage className={cn("lg:col-span-2", inventorySectionPanelClassName())}>
          <HubListPage.Error
            message={
              branchError ? getErrorMessage(branchErr, "Failed to load inventory") : undefined
            }
            onRetry={() => void refetchBranch()}
            loading={branchFetching}
          />

          <HubListPage.Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search ingredients…"
            showReset={hasActiveFilters}
            onReset={() => {
              setSearch("");
              setExpiryFilter("ALL");
            }}
            filters={
              <ListFilterSelect
                value={expiryFilter}
                onValueChange={(value) => setExpiryFilter(value as ExpiryFilter)}
                ariaLabel="Filter by expiry"
                widthClassName="w-full sm:w-[220px]"
                options={[
                  { value: "ALL", label: "All batches" },
                  { value: "expiring", label: "Expiring within 7 days" },
                  { value: "expired", label: "Expired only" },
                ]}
              />
            }
          />

          <HubListPage.Count
            isLoading={loadingBranch}
            isError={branchError}
            isFetching={branchFetching}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredInventories.length}
            totalCount={inventories.length}
            itemLabel="ingredient"
          >
            {!hasActiveFilters
              ? formatHubListCountWithFetching(
                  batchSummary.total === 0
                    ? "No batches yet"
                    : `${batchSummary.total} batch${batchSummary.total === 1 ? "" : "es"}${batchSummary.expiring + batchSummary.expired > 0 ? ` · ${batchSummary.expiring} expiring · ${batchSummary.expired} expired` : ""}`,
                  branchFetching,
                  loadingBranch,
                )
              : undefined}
          </HubListPage.Count>

          <DataTable
            loading={loadingBranch}
            isError={branchError}
            errorMessage={getErrorMessage(branchErr, "Failed to load inventory")}
            onRetry={() => void refetchBranch()}
            retryLoading={branchFetching}
            emptyDescription={
              hasActiveFilters
                ? "No ingredients match your filters."
                : "No inventory records for this branch yet."
            }
            hideBorders
            scroll={{ x: undefined }}
            columns={inventoryColumns}
            dataSource={filteredInventories}
            rowKey="id"
            expandable={{ expandedRowRender }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "15", "25"],
            }}
          />
        </HubListPage>
      </div>
    </div>
  );
}
