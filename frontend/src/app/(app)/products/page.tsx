"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useDeleteProduct } from "@/hooks/domains/useProductQueries";
import { useProductsSummary } from "@/hooks/domains/useProductsSummary";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Plus, Edit, Trash2, Coffee, ArrowRight } from "lucide-react";
import { ProductFormModal } from "@/components/products/ProductFormModal";
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
import { calcProductFoodCost, foodCostStatus } from "@/lib/food-cost";
import { productFoodCostBucket } from "@/lib/food-cost-filters";
import {
  matchesMenuStatusFilter,
  productHasRecipe,
  productIsActive,
  type MenuStatusFilter,
} from "@/lib/menu-product-filters";
import { buildProductsCostingUrl } from "@/lib/products-hub-url";
import {
  foodCostStatusClassName,
  hubCtaClassName,
  inlineLinkClassName,
  productsCategoryBadgeClassName,
  productsSectionPanelClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types/api";

export default function ProductsPage() {
  const {
    products,
    summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProductsSummary();
  const deleteMutation = useDeleteProduct();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<MenuStatusFilter>("ALL");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const costingUrl = useMemo(
    () =>
      buildProductsCostingUrl(
        categoryFilter !== "ALL" ? { category: categoryFilter } : undefined,
      ),
    [categoryFilter],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchesStatus = matchesMenuStatusFilter(p, statusFilter);
      const haystack = [p.name, p.category, String(p.id)].join(" ").toLowerCase();
      const matchesSearch = !debouncedSearch || haystack.includes(debouncedSearch);
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [products, categoryFilter, statusFilter, debouncedSearch]);

  const hasActiveFilters =
    search.trim().length > 0 || categoryFilter !== "ALL" || statusFilter !== "ALL";

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Menu item deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete menu item"));
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
          title: "Menu Name",
          dataIndex: "name",
          key: "name",
          render: (name: string) => (
            <span className={cn("font-bold", text.primary)}>{name}</span>
          ),
        },
        {
          title: "Category",
          dataIndex: "category",
          key: "category",
          responsive: ["md"],
          render: (category: string) => (
            <span className={productsCategoryBadgeClassName()}>{category}</span>
          ),
        },
        {
          title: "Price (฿)",
          dataIndex: "price",
          key: "price",
          render: (price: number) => (
            <span className={cn("font-bold tabular-nums", text.primary)}>
              {formatBaht(price)}
            </span>
          ),
        },
        {
          title: "Food Cost %",
          key: "foodCost",
          responsive: ["md"],
          render: (_: unknown, record: Product) => {
            const bucket = productFoodCostBucket(record);
            if (bucket === "no-recipe") {
              return (
                <Link
                  href={buildProductsCostingUrl({ status: "no-recipe" })}
                  className={inlineLinkClassName()}
                >
                  No recipe
                </Link>
              );
            }
            if (bucket === "no-price") {
              return <span className={text.muted}>No price</span>;
            }
            const { cost, foodCostPercent } = calcProductFoodCost(record);
            const status = foodCostStatus(foodCostPercent);
            return (
              <div>
                <Link
                  href={buildProductsCostingUrl({
                    status,
                    ...(record.category ? { category: record.category } : {}),
                  })}
                  className={cn(foodCostStatusClassName(status), "hover:opacity-80")}
                >
                  {foodCostPercent.toFixed(1)}%
                </Link>
                <div className={cn("text-xs", tableCellMutedClassName())}>
                  COGS {formatBaht(cost)}
                </div>
              </div>
            );
          },
        },
        {
          title: "Status",
          key: "isActive",
          render: (_: unknown, record: Product) =>
            productIsActive(record) ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Inactive</StatusBadge>
            ),
        },
        {
          title: "Menu Recipe",
          key: "recipe",
          responsive: ["lg"],
          render: (_: unknown, record: Product) =>
            productHasRecipe(record) ? (
              <StatusBadge tone="info">
                {record.recipeItems!.length} ingredients
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">No Menu Recipe</StatusBadge>
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
          render: (_: unknown, record: Product) => (
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
      ] as ColumnsType<Product>,
    [handleEdit],
  );

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={Coffee}
        accentHub="products"
        actions={
          <Button onClick={handleAddNew} className={hubCtaClassName("products", "font-bold")}>
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Add Menu Item
          </Button>
        }
      />

      <HubListPage className={productsSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load menu items") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search menu items…"
          showReset={hasActiveFilters}
          onReset={() => {
            setSearch("");
            setCategoryFilter("ALL");
            setStatusFilter("ALL");
          }}
          filters={
            <>
              <ListFilterSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                ariaLabel="Filter by category"
                widthClassName="w-full sm:w-[200px]"
                options={[
                  { value: "ALL", label: "All categories" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as MenuStatusFilter)}
                ariaLabel="Filter by status"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
              <ButtonLink
                href={costingUrl}
                variant="outline"
                className="min-h-[44px] font-medium"
              >
                Open in Food Cost
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden />
              </ButtonLink>
            </>
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredProducts.length}
          totalCount={summary.total}
          itemLabel="menu item"
          emptyLabel="No menu items yet"
        />

        <DataTable
          loading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(error, "Failed to load menu items")}
          onRetry={() => void refetch()}
          retryLoading={isFetching}
          emptyDescription={
            hasActiveFilters
              ? "No menu items match your filters."
              : "No menu items yet. Add raw ingredients first, then create menu items for the POS."
          }
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
          hideBorders
        />
      </HubListPage>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct ?? undefined}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete menu item?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}" from the menu? This cannot be undone.`
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
