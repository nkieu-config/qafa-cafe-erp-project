"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useProductionBOMs } from "@/hooks/domains/useAccountingQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { ListTree, Loader2, Plus } from "lucide-react";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { DataTable } from "@/components/shared/data-table";
import { BOMModalForm } from "@/components/kitchen/BOMModalForm";
import { CentralKitchenBanner } from "@/components/kitchen/central-kitchen-banner";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import { formatBaht } from "@/lib/money";
import { groupProductionBoms } from "@/lib/bom";
import { buildProductsCostingUrl, buildProductsIngredientsUrl } from "@/lib/products-hub-url";
import { matchesBomSearch, summarizeProductionBoms } from "@/lib/bom-filters";
import type { BomGroupRow, BomTableRow, ProductionBOM } from "@/types/api";
import {
  hubCardIconFor,
  hubCtaClassName,
  inlineLinkClassName,
  kitchenMetaBadgeClassName,
  kitchenSectionPanelClassName,
  summaryChipClassName,
  metricValueClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function BOMPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  const {
    data: bomsData = [],
    isLoading: loadingBoms,
    isError: bomsError,
    error: bomsErr,
    refetch: refetchBoms,
    isFetching: bomsFetching,
  } = useProductionBOMs();
  const { data: ingredients = [], isLoading: loadingIng } = useIngredients();

  const loading = loadingBoms || loadingIng;

  const bomsGrouped = useMemo(
    () => groupProductionBoms(bomsData as ProductionBOM[]),
    [bomsData],
  );

  const filteredGroups = useMemo(
    () => bomsGrouped.filter((group) => matchesBomSearch(group, debouncedSearch)),
    [bomsGrouped, debouncedSearch],
  );

  const summary = useMemo(() => summarizeProductionBoms(bomsGrouped), [bomsGrouped]);

  const columns: ColumnsType<BomTableRow> = useMemo(
    () => [
      {
        title: "Target / Raw Ingredient",
        dataIndex: "targetName",
        key: "name",
        render: (_: unknown, record) => {
          if ("isGroup" in record && record.isGroup) {
            return (
              <span className={cn("font-bold text-base", text.primary)}>
                {record.targetName}
              </span>
            );
          }
          return <span className={cn(text.secondary, "pl-4")}>{record.rawName}</span>;
        },
      },
      {
        title: "Quantity Needed",
        key: "quantity",
        responsive: ["sm"],
        render: (_: unknown, record) => {
          if ("isGroup" in record && record.isGroup) {
            return (
              <span className={cn("text-xs uppercase tracking-wider", text.muted)}>
                Per 1 {record.targetUnit}
              </span>
            );
          }
          return (
            <span className="font-mono font-medium tabular-nums">
              {record.quantityNeeded} {record.rawUnit}
            </span>
          );
        },
      },
      {
        title: "Est. Cost",
        key: "cost",
        align: "right" as const,
        render: (_: unknown, record) => {
          if ("isGroup" in record && record.isGroup) {
            const total = record.children.reduce((sum, c) => sum + c.totalCost, 0);
            const hasMissingCost = record.children.some((c) => c.costPerUnit <= 0);
            return (
              <div className="flex flex-col items-end gap-1">
                <span className={cn("font-bold tabular-nums", metricValueClassName("red"))}>
                  {formatBaht(total)}
                </span>
                {hasMissingCost && (
                  <Link
                    href={buildProductsIngredientsUrl({ cost: "missing-cost" })}
                    className={cn("text-xs", inlineLinkClassName())}
                  >
                    Missing cost lines
                  </Link>
                )}
              </div>
            );
          }
          return (
            <span className={cn(text.subtle, "tabular-nums")}>
              {formatBaht(record.totalCost)}
            </span>
          );
        },
      },
      {
        title: "Food Cost",
        key: "foodcost",
        responsive: ["md"],
        render: (_: unknown, record) => {
          if ("isGroup" in record && record.isGroup) {
            return (
              <Link href={buildProductsCostingUrl()} className={inlineLinkClassName()}>
                View in Food Cost
              </Link>
            );
          }
          return null;
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        icon={ListTree}
        accentHub="kitchen"
        actions={
          <Button
            className={hubCtaClassName("kitchen", "font-bold")}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Create BOM
          </Button>
        }
      />

      <CentralKitchenBanner message="Production BOMs are managed at the central kitchen branch." />

      <HubListPage className={kitchenSectionPanelClassName()}>
        <HubListPage.Error
          message={bomsError ? getErrorMessage(bomsErr, "Failed to load production BOMs") : undefined}
          onRetry={() => void refetchBoms()}
          loading={bomsFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search target or raw ingredient…"
          showReset={search.trim().length > 0}
          onReset={() => setSearch("")}
        />

        <HubListPage.Count isLoading={loading} isError={bomsError} isFetching={bomsFetching}>
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className={cn("font-semibold tabular-nums", text.primary)}>
              {summary.targets} BOM target{summary.targets === 1 ? "" : "s"}
            </span>
            {summary.rawLines > 0 && (
              <span className={summaryChipClassName("kitchen", false, text.secondary)}>
                {summary.rawLines} raw line{summary.rawLines === 1 ? "" : "s"}
              </span>
            )}
            {summary.missingCostLines > 0 && (
              <Link
                href={buildProductsIngredientsUrl({ cost: "missing-cost" })}
                className={summaryChipClassName("kitchen", false, metricValueClassName("amber"))}
              >
                {summary.missingCostLines} missing cost
              </Link>
            )}
            {summary.targets === 0 && (
              <span className={text.muted}>
                No BOMs yet —{" "}
                <Link href="/products/ingredients" className={inlineLinkClassName()}>
                  add ingredients
                </Link>{" "}
                then define a BOM
              </span>
            )}
            {bomsFetching && !loading && (
              <span className={cn("inline-flex items-center gap-1.5", text.muted)}>
                <Loader2
                  className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
                Updating…
              </span>
            )}
          </span>
        </HubListPage.Count>

        {!loading && !bomsError && filteredGroups.length === 0 ? (
          <div className="py-16 text-center">
            <ListTree className={hubCardIconFor("kitchen", "w-12 h-12 mx-auto mb-4")} />
            <p className={cn("font-semibold", text.primary)}>
              {search.trim() ? "No BOMs match your search" : "No production BOMs yet"}
            </p>
            <p className={cn("text-sm mt-2 max-w-md mx-auto", text.muted)}>
              {search.trim()
                ? "Try a different target or raw ingredient name."
                : "Create a production BOM to define raw ingredients and quantities for each finished product."}
            </p>
            {!search.trim() && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  className={hubCtaClassName("kitchen", "font-bold")}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden />
                  Create first BOM
                </Button>
                <Link href="/products/ingredients" className={kitchenMetaBadgeClassName("px-4 py-2")}>
                  Raw ingredients
                </Link>
              </div>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            dataSource={filteredGroups as BomGroupRow[]}
            rowKey="id"
            loading={loading}
            pagination={false}
            defaultExpandAllRows
            hideBorders
            isError={bomsError}
            onRetry={() => void refetchBoms()}
            errorMessage={getErrorMessage(bomsErr, "Failed to load production BOMs")}
          />
        )}
      </HubListPage>

      <BOMModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ingredients={ingredients}
      />
    </div>
  );
}
