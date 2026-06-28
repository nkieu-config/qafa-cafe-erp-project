"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useIngredients,
  useDeleteIngredient,
} from "@/hooks/domains/useProductQueries";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Plus,
  Edit,
  Trash2,
  Leaf,
  ArrowDownToLine,
  Building2,
} from "lucide-react";
import { IngredientFormModal } from "@/components/products/IngredientFormModal";
import { DataTable } from "@/components/shared/data-table";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/intl-date";
import { formatBaht } from "@/lib/money";
import {
  ingredientIsActive,
  ingredientMissingCost,
  matchesIngredientCostFilter,
  matchesIngredientStatusFilter,
  type IngredientCostFilter,
  type IngredientStatusFilter,
} from "@/lib/ingredient-filters";
import { parseProductsIngredientsSearchParams } from "@/lib/products-hub-url";
import {
  hubCtaClassName,
  metricValueClassName,
  productsCategoryBadgeClassName,
  productsSectionPanelClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Ingredient } from "@/types/api";

export default function IngredientsPage() {
  const searchParams = useSearchParams();
  const {
    data: ingredients,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useIngredients();
  const deleteMutation = useDeleteIngredient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [statusFilter, setStatusFilter] = useState<IngredientStatusFilter>("ALL");
  const [costFilter, setCostFilter] = useState<IngredientCostFilter>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);

  useEffect(() => {
    const parsed = parseProductsIngredientsSearchParams(searchParams);
    if (parsed.cost !== "ALL") setCostFilter(parsed.cost);
  }, [searchParams]);

  const summary = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let missingCost = 0;
    for (const item of ingredients ?? []) {
      if (ingredientIsActive(item)) active += 1;
      else inactive += 1;
      if (ingredientMissingCost(item)) missingCost += 1;
    }
    return { total: ingredients?.length ?? 0, active, inactive, missingCost };
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    return (ingredients ?? []).filter((item: Ingredient) => {
      const haystack = [
        item.name,
        item.unit,
        item.primarySupplier?.name ?? "",
        String(item.id),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !debouncedSearch || haystack.includes(debouncedSearch);
      const matchesStatus = matchesIngredientStatusFilter(item, statusFilter);
      const matchesCost = matchesIngredientCostFilter(item, costFilter);
      return matchesSearch && matchesStatus && matchesCost;
    });
  }, [ingredients, debouncedSearch, statusFilter, costFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "ALL" || costFilter !== "ALL";

  const handleEdit = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsModalOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedIngredient(null);
    setIsModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Ingredient deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete ingredient"));
    }
  };

  const columns = useMemo(
    () =>
      [
        {
          title: "ID",
          dataIndex: "id",
          key: "id",
          responsive: ["lg"],
          render: (id: number) => (
            <span className={tableCellMutedClassName()}>#{id}</span>
          ),
        },
        {
          title: "Ingredient Name",
          dataIndex: "name",
          key: "name",
          render: (name: string) => (
            <span className={cn("font-bold", text.primary)}>{name}</span>
          ),
        },
        {
          title: "Unit",
          dataIndex: "unit",
          key: "unit",
          responsive: ["md"],
          render: (unit: string) => (
            <span className={productsCategoryBadgeClassName()}>{unit}</span>
          ),
        },
        {
          title: "Cost / Unit (฿)",
          dataIndex: "costPerUnit",
          key: "costPerUnit",
          render: (costPerUnit?: number) => {
            const missing = costPerUnit == null || costPerUnit <= 0;
            return (
              <span
                className={cn(
                  "font-bold tabular-nums",
                  missing ? metricValueClassName("amber") : text.primary,
                )}
              >
                {!missing ? formatBaht(costPerUnit) : "—"}
              </span>
            );
          },
        },
        {
          title: "Primary Supplier",
          key: "primarySupplier",
          responsive: ["md"],
          render: (_: unknown, record: Ingredient) =>
            record.primarySupplier?.name ? (
              <Link
                href="/procurement/suppliers"
                className={cn("text-sm font-medium hover:opacity-80", text.secondary)}
              >
                {record.primarySupplier.name}
              </Link>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        {
          title: "Status",
          key: "isActive",
          render: (_: unknown, record: Ingredient) =>
            ingredientIsActive(record) ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Inactive</StatusBadge>
            ),
        },
        {
          title: "Created",
          dataIndex: "createdAt",
          key: "createdAt",
          responsive: ["lg"],
          render: (createdAt?: string) => (
            <span className={cn("text-sm font-medium", text.muted)}>
              {createdAt ? formatDate(createdAt) : "—"}
            </span>
          ),
        },
        {
          title: "",
          key: "actions",
          width: 96,
          align: "right" as const,
          render: (_: unknown, record: Ingredient) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton
                icon={Edit}
                label={`Edit ${record.name}`}
                iconOnly
                tone="purple"
                onClick={() => handleEdit(record)}
              />
              <TableActionButton
                icon={Trash2}
                label={`Delete ${record.name}`}
                iconOnly
                destructive
                onClick={() => setDeleteTarget(record)}
              />
            </div>
          ),
        },
      ] as ColumnsType<Ingredient>,
    [handleEdit],
  );

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={Leaf}
        accentHub="products"
        actions={
          <>
            <ButtonLink href="/inventory/stock-in" variant="outline" className="font-medium">
              <ArrowDownToLine className="w-4 h-4 mr-2" aria-hidden />
              Receive Stock
            </ButtonLink>
            <ButtonLink href="/procurement/suppliers" variant="outline" className="font-medium">
              <Building2 className="w-4 h-4 mr-2" aria-hidden />
              Suppliers
            </ButtonLink>
            <Button onClick={handleAddNew} className={hubCtaClassName("products", "font-bold")}>
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              Add Ingredient
            </Button>
          </>
        }
      />

      <HubListPage className={productsSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load ingredients") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search ingredients…"
          showReset={hasActiveFilters}
          onReset={() => {
            setSearch("");
            setStatusFilter("ALL");
            setCostFilter("ALL");
          }}
          filters={
            <>
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as IngredientStatusFilter)}
                ariaLabel="Filter by status"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
              <ListFilterSelect
                value={costFilter}
                onValueChange={(value) => setCostFilter(value as IngredientCostFilter)}
                ariaLabel="Filter by cost data"
                widthClassName="w-full sm:w-[200px]"
                options={[
                  { value: "ALL", label: "All cost levels" },
                  { value: "missing-cost", label: "Missing cost" },
                ]}
              />
            </>
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredIngredients.length}
          totalCount={summary.total}
          itemLabel="ingredient"
          emptyLabel="No ingredients yet"
        />

        <DataTable
          loading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(error, "Failed to load ingredients")}
          onRetry={() => void refetch()}
          retryLoading={isFetching}
          emptyDescription={
            hasActiveFilters
              ? "No ingredients match your filters."
              : "No ingredients yet. Add raw materials to build menu recipes and production BOMs."
          }
          columns={columns}
          dataSource={filteredIngredients}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
          hideBorders
        />
      </HubListPage>

      <IngredientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIngredient(null);
        }}
        ingredient={selectedIngredient ?? undefined}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete ingredient?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}" from the catalog? This cannot be undone if it is referenced by recipes.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
