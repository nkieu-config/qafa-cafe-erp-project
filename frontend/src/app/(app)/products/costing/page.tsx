"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { useOrders } from "@/hooks/domains/useReportsQueries";
import { useProductsSummary } from "@/hooks/domains/useProductsSummary";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DataTable } from "@/components/shared/data-table";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { FoodCostMarginPanel } from "@/components/products/FoodCostMarginPanel";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { getErrorMessage } from "@/lib/errors";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import { formatBaht } from "@/lib/money";
import { calcProductFoodCost, foodCostStatus } from "@/lib/food-cost";
import {
  matchesFoodCostActiveFilter,
  matchesFoodCostStatusFilter,
  productFoodCostBucket,
  productHasMissingIngredientCost,
  type FoodCostActiveFilter,
  type FoodCostStatusFilter,
} from "@/lib/food-cost-filters";
import { productHasRecipe } from "@/lib/menu-product-filters";
import { parseProductsCostingSearchParams } from "@/lib/products-hub-url";
import {
  foodCostProgressIndicatorClassName,
  foodCostStatusClassName,
  inlineLinkClassName,
  metricValueClassName,
  productsCategoryBadgeClassName,
  productsSectionPanelClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

const TARGET_FOOD_COST = 30;

function foodCostStatusLabel(bucket: ReturnType<typeof productFoodCostBucket>) {
  switch (bucket) {
    case "good":
      return "On target";
    case "warn":
      return "Watch";
    case "bad":
      return "High cost";
    case "no-recipe":
      return "No recipe";
    case "no-price":
      return "No price";
  }
}

function foodCostStatusTone(
  bucket: ReturnType<typeof productFoodCostBucket>,
): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (bucket) {
    case "good":
      return "success";
    case "warn":
      return "warning";
    case "bad":
      return "danger";
    case "no-recipe":
      return "neutral";
    case "no-price":
      return "info";
  }
}

export default function FoodCostPage() {
  const searchParams = useSearchParams();
  const {
    products,
    summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProductsSummary();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<FoodCostStatusFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<FoodCostActiveFilter>("ALL");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const parsed = parseProductsCostingSearchParams(searchParams);
    if (parsed.status !== "ALL") setStatusFilter(parsed.status);
    if (parsed.category !== "ALL") setCategoryFilter(parsed.category);
  }, [searchParams]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category) set.add(product.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const haystack = [
        product.name,
        product.category ?? "",
        String(product.id),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !debouncedSearch || haystack.includes(debouncedSearch);
      const matchesCategory =
        categoryFilter === "ALL" || product.category === categoryFilter;
      const matchesStatus = matchesFoodCostStatusFilter(product, statusFilter);
      const matchesActive = matchesFoodCostActiveFilter(product, activeFilter);
      return matchesSearch && matchesCategory && matchesStatus && matchesActive;
    });
  }, [products, debouncedSearch, categoryFilter, statusFilter, activeFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    activeFilter !== "ALL";

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      [
        {
          title: "Menu Item",
          dataIndex: "name",
          key: "name",
          render: (name: string, record: Product) => (
            <div>
              <span className={cn("font-bold", text.primary)}>{name}</span>
              {productHasMissingIngredientCost(record) && (
                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    metricValueClassName("amber"),
                  )}
                >
                  <AlertTriangle className="w-3 h-3" aria-hidden />
                  Missing ingredient cost
                </div>
              )}
            </div>
          ),
        },
        {
          title: "Category",
          dataIndex: "category",
          key: "category",
          responsive: ["md"],
          render: (category: string) =>
            category ? (
              <span className={productsCategoryBadgeClassName()}>{category}</span>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        {
          title: "Sale Price",
          dataIndex: "price",
          key: "price",
          align: "right" as const,
          render: (price: number) => (
            <span className={cn("font-bold tabular-nums", text.primary)}>
              {formatBaht(price)}
            </span>
          ),
        },
        {
          title: "Recipe Cost",
          key: "recipeCost",
          align: "right" as const,
          responsive: ["md"],
          render: (_: unknown, record: Product) => {
            if (!productHasRecipe(record)) {
              return <span className={text.muted}>—</span>;
            }
            const { cost } = calcProductFoodCost(record);
            return (
              <span className={cn("font-bold tabular-nums", metricValueClassName("red"))}>
                {formatBaht(cost)}
              </span>
            );
          },
        },
        {
          title: `Food Cost % (target ≤ ${TARGET_FOOD_COST}%)`,
          key: "foodCostPercent",
          render: (_: unknown, record: Product) => {
            const bucket = productFoodCostBucket(record);
            if (bucket === "no-recipe") {
              return (
                <Link href="/products" className={inlineLinkClassName()}>
                  Add recipe
                </Link>
              );
            }
            if (bucket === "no-price") {
              return <span className={text.muted}>Set sale price</span>;
            }

            const { foodCostPercent } = calcProductFoodCost(record);
            const status = foodCostStatus(foodCostPercent);
            const isWarning = status !== "good";
            const percent = parseFloat(foodCostPercent.toFixed(1));

            return (
              <div className="flex flex-wrap items-center gap-3 min-w-[8rem]">
                <Progress value={Math.min(percent, 100)} className="w-28 gap-1">
                  <ProgressTrack className="h-2">
                    <ProgressIndicator
                      className={foodCostProgressIndicatorClassName(isWarning)}
                    />
                  </ProgressTrack>
                  <ProgressValue
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      foodCostStatusClassName(status),
                    )}
                  />
                </Progress>
                {status === "bad" && (
                  <StatusBadge tone="danger" className="gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3" aria-hidden />
                    High
                  </StatusBadge>
                )}
              </div>
            );
          },
        },
        {
          title: "Status",
          key: "status",
          responsive: ["lg"],
          render: (_: unknown, record: Product) => {
            const bucket = productFoodCostBucket(record);
            return (
              <StatusBadge tone={foodCostStatusTone(bucket)}>
                {foodCostStatusLabel(bucket)}
              </StatusBadge>
            );
          },
        },
        {
          title: "Recipe",
          key: "recipe",
          responsive: ["lg"],
          render: (_: unknown, record: Product) =>
            productHasRecipe(record) ? (
              <span className={tableCellMutedClassName()}>
                {record.recipeItems!.length} ingredient
                {record.recipeItems!.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        {
          title: "",
          key: "actions",
          width: 72,
          align: "right" as const,
          render: (_: unknown, record: Product) => (
            <TableActionButton
              icon={Edit}
              label={`Edit recipe for ${record.name}`}
              iconOnly
              tone="purple"
              onClick={() => handleEdit(record)}
            />
          ),
        },
      ] as ColumnsType<Product>,
    [handleEdit],
  );

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={BarChart3}
        accentHub="products"
      />

      <HubListPage className={productsSectionPanelClassName()}>
        <HubListPage.Error
          message={
            isError ? getErrorMessage(error, "Failed to load menu items for food cost") : undefined
          }
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        {!isLoading && !isError && (
          <HubListPage.Banner>
            <FoodCostMarginPanel
              orders={orders}
              theoreticalAvgPercent={summary.foodCost.avgPercent}
              ordersLoading={ordersLoading}
            />
          </HubListPage.Banner>
        )}

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search menu items…"
          showReset={hasActiveFilters}
          onReset={() => {
            setSearch("");
            setCategoryFilter("ALL");
            setStatusFilter("ALL");
            setActiveFilter("ALL");
          }}
          filters={
            <>
              <ListFilterSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                ariaLabel="Filter by category"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All categories" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as FoodCostStatusFilter)}
                ariaLabel="Filter by food cost status"
                widthClassName="w-full sm:w-[200px]"
                options={[
                  { value: "ALL", label: "All food cost levels" },
                  { value: "good", label: "On target (≤30%)" },
                  { value: "warn", label: "Watch (31–40%)" },
                  { value: "bad", label: "High cost (>40%)" },
                  { value: "no-recipe", label: "No recipe" },
                  { value: "missing-cost", label: "Missing ingredient cost" },
                ]}
              />
              <ListFilterSelect
                value={activeFilter}
                onValueChange={(value) => setActiveFilter(value as FoodCostActiveFilter)}
                ariaLabel="Filter by menu status"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  { value: "active", label: "Active only" },
                  { value: "inactive", label: "Inactive only" },
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
          filteredCount={filteredProducts.length}
          totalCount={summary.total}
          itemLabel="menu item"
          emptyLabel="No menu items yet"
        >
          {!hasActiveFilters && summary.total > 0 && summary.foodCost.avgPercent > 0
            ? formatHubListCountWithFetching(
                `${summary.total} menu item${summary.total === 1 ? "" : "s"} · avg ${summary.foodCost.avgPercent.toFixed(1)}% food cost`,
                isFetching,
                isLoading,
              )
            : undefined}
        </HubListPage.Count>

        <DataTable
          loading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(error, "Failed to load menu items")}
          onRetry={() => void refetch()}
          retryLoading={isFetching}
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
          hideBorders
          emptyDescription={
            hasActiveFilters
              ? "No menu items match your food cost filters."
              : "No menu items yet. Add recipes on Menu Items to track food cost."
          }
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
    </>
  );
}
