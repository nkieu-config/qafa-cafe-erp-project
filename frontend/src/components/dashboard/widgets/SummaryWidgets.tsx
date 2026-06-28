"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Store,
  AlertTriangle,
  CheckCircle2,
  Award,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAnalyticsSummarySuspense, useTopProductsSuspense } from "@/hooks/domains/useReportsQueries";
import {
  useBranchDetails,
  useBranchInventory,
} from "@/hooks/domains/useInventoryQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import {
  buildExpiryAlerts,
  buildLowStockAlerts,
  countExpiringBatches,
  countLowStockRecords,
  DASHBOARD_ALERT_PREVIEW_LIMIT,
  type DashboardExpiryAlert,
  type DashboardLowStockAlert,
} from "@/lib/inventory-alerts";
import { formatDashboardCurrency } from "./format-currency";
import { formatDate } from "@/lib/intl-date";
import {
  dashboardAlertsEmptyClass,
  dashboardAlertsFooterClass,
  dashboardAlertsFooterLinkClass,
  dashboardAlertsHeaderClass,
  dashboardAlertsRowClass,
  dashboardSkeletonClass,
  dashboardTrendBadgeClass,
  dashboardWidgetCardClass,
  dashboardWidgetIconSoftClass,
  dashboardWidgetIconSolidClass,
  dashboardWidgetLabelClass,
  dashboardWidgetTitleClass,
  dashboardWidgetValueClass,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/endpoints";
import { fetchAPI } from "@/lib/api";
import type { Branch } from "@/types/api";

const TopProductsChart = dynamic(
  () => import("@/components/dashboard/TopProductsChart").then((m) => m.TopProductsChart),
  {
    ssr: false,
    loading: () => <div className={dashboardSkeletonClass("h-full w-full")} />,
  },
);

function hasComparableSalesGrowth(
  salesGrowth: number | null | undefined,
  salesYesterday: number | null | undefined,
): salesGrowth is number {
  return (
    typeof salesGrowth === "number" &&
    Number.isFinite(salesGrowth) &&
    typeof salesYesterday === "number" &&
    salesYesterday > 0
  );
}

export function SalesWidget({ branchId }: { branchId: string }) {
  const { data: summary } = useAnalyticsSummarySuspense(branchId);
  const showGrowth = hasComparableSalesGrowth(summary?.salesGrowth, summary?.salesYesterday);

  return (
    <Card className={dashboardWidgetCardClass("sales")}>
      <CardContent className="p-8 h-full flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className={dashboardWidgetLabelClass("sales")}>Today&apos;s Sales</p>
            <p className={cn("text-4xl mt-2 tabular-nums", dashboardWidgetValueClass("sales"))}>
              {formatDashboardCurrency(summary?.salesToday || 0)}
            </p>
            <div className="flex items-center gap-2 mt-4 min-h-[1.75rem]">
              {showGrowth ? (
                <>
                  <span
                    className={cn(
                      "flex items-center text-sm font-bold px-2 py-1 rounded tabular-nums",
                      dashboardTrendBadgeClass(summary.salesGrowth >= 0),
                    )}
                  >
                    {summary.salesGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" aria-hidden />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" aria-hidden />
                    )}
                    {Math.abs(summary.salesGrowth).toFixed(1)}%
                  </span>
                  <span className={cn("text-sm font-medium", text.muted)}>vs yesterday</span>
                </>
              ) : (
                <span className={cn("text-sm font-medium", text.muted)}>No prior-day comparison</span>
              )}
            </div>
          </div>
          <div className={dashboardWidgetIconSolidClass()}>
            <DollarSign className="w-8 h-8" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopBranchWidget({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName?: string;
}) {
  const { data: summary } = useAnalyticsSummarySuspense(branchId);
  const isAllBranches = branchId === "ALL";

  return (
    <Card className={dashboardWidgetCardClass("branch")}>
      <CardContent className="p-8 h-full flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className={dashboardWidgetLabelClass("branch")}>
              {isAllBranches ? "Top Branch Today" : "Branch Sales Today"}
            </p>
            <p className={cn("text-3xl mt-2", text.primary)}>
              {isAllBranches
                ? summary?.topBranch?.name || "N/A"
                : branchName || "Current branch"}
            </p>
            <p
              className={cn(
                "text-xl font-bold mt-2 tabular-nums",
                dashboardWidgetValueClass("branch"),
              )}
            >
              {formatDashboardCurrency(
                isAllBranches
                  ? summary?.topBranch?.totalSales || 0
                  : summary?.salesToday || 0,
              )}
            </p>
          </div>
          <div className={dashboardWidgetIconSoftClass("branch")}>
            <Store className="w-8 h-8" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({
  href,
  children,
  type,
}: {
  href: string;
  type: "low" | "expiry";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        dashboardAlertsRowClass(type),
        "transition-colors hover:brightness-[0.98] dark:hover:brightness-110",
      )}
    >
      {children}
    </Link>
  );
}

function InventoryAlertsFooter({
  lowTotal,
  expiryTotal,
  isAllBranches,
}: {
  lowTotal: number;
  expiryTotal: number;
  isAllBranches: boolean;
}) {
  if (lowTotal === 0 && expiryTotal === 0) return null;

  const lowCapped = isAllBranches && lowTotal >= DASHBOARD_ALERT_PREVIEW_LIMIT;
  const expiryCapped = isAllBranches && expiryTotal >= DASHBOARD_ALERT_PREVIEW_LIMIT;

  return (
    <div className={dashboardAlertsFooterClass()}>
      {lowTotal > 0 && (
        <Link href="/inventory?filter=low" className={dashboardAlertsFooterLinkClass()}>
          {lowCapped ? "View all low stock" : `View all low stock (${lowTotal})`}
        </Link>
      )}
      {expiryTotal > 0 && (
        <Link href="/inventory/batches" className={dashboardAlertsFooterLinkClass()}>
          {expiryCapped
            ? "View expiring batches"
            : `View expiring batches (${expiryTotal})`}
        </Link>
      )}
    </div>
  );
}

function InventoryAlertsList({
  lowStockAlerts,
  expiryAlerts,
  lowTotal,
  expiryTotal,
  isAllBranches,
}: {
  lowStockAlerts: DashboardLowStockAlert[];
  expiryAlerts: DashboardExpiryAlert[];
  lowTotal: number;
  expiryTotal: number;
  isAllBranches: boolean;
}) {
  const hasAlerts = lowStockAlerts.length > 0 || expiryAlerts.length > 0;

  return (
    <>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {hasAlerts ? (
          <div className="divide-y divide-[var(--widget-alerts-divider)]">
            {lowStockAlerts.map((alert) => (
              <AlertRow key={`low-${alert.id}`} href="/inventory?filter=low" type="low">
                <div>
                  <div className={cn("font-bold text-lg", text.primary)}>{alert.ingredientName}</div>
                  <div className={cn("text-sm font-medium", text.muted)}>
                    {alert.branchName} · Low stock
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl tabular-nums text-[var(--widget-alerts-low-value)]">
                    {alert.stock}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--widget-alerts-low-meta)]">
                    Min: {alert.minStock}
                  </div>
                </div>
              </AlertRow>
            ))}
            {expiryAlerts.map((alert) => (
              <AlertRow key={`exp-${alert.id}`} href="/inventory/batches" type="expiry">
                <div>
                  <div className={cn("font-bold text-lg", text.primary)}>{alert.ingredientName}</div>
                  <div className={cn("text-sm font-medium", text.muted)}>
                    {alert.branchName} ·{" "}
                    {alert.status === "EXPIRED" ? "Expired batch" : "Expiring soon"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl tabular-nums text-[var(--widget-alerts-expiry-value)]">
                    {alert.quantity}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--widget-alerts-expiry-meta)]">
                    {formatDate(alert.expiryDate)}
                  </div>
                </div>
              </AlertRow>
            ))}
          </div>
        ) : (
          <div className={dashboardAlertsEmptyClass()}>
            <CheckCircle2
              className="w-12 h-12 mb-3 text-[var(--widget-alerts-empty-icon)]"
              aria-hidden
            />
            <span className="font-bold text-lg text-[var(--widget-alerts-empty-text)]">
              Stock and expiry levels look healthy.
            </span>
          </div>
        )}
      </CardContent>
      <InventoryAlertsFooter
        lowTotal={lowTotal}
        expiryTotal={expiryTotal}
        isAllBranches={isAllBranches}
      />
    </>
  );
}

export function LowStockWidget({ branchId }: { branchId: string }) {
  const isAllBranches = branchId === "ALL";
  const parsedBranchId = isAllBranches ? undefined : Number(branchId);
  const { data: branches = [] } = useBranches();
  const branchName =
    parsedBranchId != null
      ? (branches as Branch[]).find((b) => b.id === parsedBranchId)?.name ?? "Branch"
      : "Branch";

  const { data: summary } = useQuery({
    queryKey: ["analyticsSummary", branchId],
    queryFn: () => fetchAPI(API_ENDPOINTS.reports.executiveSummary(branchId)),
    enabled: isAllBranches,
  });
  const { data: inventory = [], isLoading: loadingInventory } = useBranchInventory(parsedBranchId);
  const { data: branchDetails, isLoading: loadingBranch } = useBranchDetails(parsedBranchId);

  const branchAlerts = useMemo(() => {
    if (isAllBranches) return null;

    const lowStockAlerts = buildLowStockAlerts(inventory, branchName);
    const expiryAlerts = buildExpiryAlerts(branchDetails?.inventoryBatches, branchName);

    return {
      lowStockAlerts,
      expiryAlerts,
      lowTotal: countLowStockRecords(inventory),
      expiryTotal: countExpiringBatches(branchDetails?.inventoryBatches),
    };
  }, [branchDetails?.inventoryBatches, branchName, inventory, isAllBranches]);

  const allBranchAlerts = useMemo(() => {
    if (!isAllBranches || !summary) return null;

    const lowStockAlerts = (summary.lowStockAlerts ?? []) as DashboardLowStockAlert[];
    const expiryAlerts = (summary.expiryAlerts ?? []) as DashboardExpiryAlert[];

    return {
      lowStockAlerts,
      expiryAlerts,
      lowTotal: lowStockAlerts.length,
      expiryTotal: expiryAlerts.length,
    };
  }, [isAllBranches, summary]);

  const alerts = branchAlerts ?? allBranchAlerts ?? {
    lowStockAlerts: [],
    expiryAlerts: [],
    lowTotal: 0,
    expiryTotal: 0,
  };

  if (!isAllBranches && (loadingInventory || loadingBranch)) {
    return <div className={dashboardSkeletonClass("h-[300px] w-full")} />;
  }

  if (isAllBranches && !summary) {
    return <div className={dashboardSkeletonClass("h-[300px] w-full")} />;
  }

  return (
    <Card className={dashboardWidgetCardClass("alerts", "h-[300px] overflow-hidden flex flex-col")}>
      <CardHeader className={dashboardAlertsHeaderClass()}>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" aria-hidden />
          Inventory Alerts
        </CardTitle>
      </CardHeader>
      <InventoryAlertsList
        lowStockAlerts={alerts.lowStockAlerts}
        expiryAlerts={alerts.expiryAlerts}
        lowTotal={alerts.lowTotal}
        expiryTotal={alerts.expiryTotal}
        isAllBranches={isAllBranches}
      />
    </Card>
  );
}

export function TopProductsWidget({ branchId }: { branchId: string }) {
  const { data: topProducts } = useTopProductsSuspense(branchId);

  return (
    <Card className={dashboardWidgetCardClass("products", "h-[400px] flex flex-col")}>
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className={cn("flex items-center gap-2 text-2xl", dashboardWidgetTitleClass("products"))}>
          <Award className="w-6 h-6" aria-hidden /> Top 5 Best Sellers
        </CardTitle>
        <CardDescription className={cn("font-medium text-sm", text.muted)}>
          Highest volume items today
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-4">
        <TopProductsChart data={topProducts ?? []} />
      </CardContent>
    </Card>
  );
}
