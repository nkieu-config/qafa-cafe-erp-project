"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useAuth } from "@/context/AuthContext";
import { AnimatedPage } from "@/components/animated-page";
import type { Branch } from "@/types/api";
import {
  SalesWidget,
  TopBranchWidget,
  LowStockWidget,
  TopProductsWidget,
} from "@/components/dashboard/widgets/SummaryWidgets";
import { SalesChartWidget } from "@/components/dashboard/widgets/SalesChartWidget";
import { WidgetErrorBoundary } from "@/components/dashboard/widgets/WidgetErrorBoundary";
import {
  StatWidgetSkeleton,
  AlertsWidgetSkeleton,
  ChartWidgetSkeleton,
} from "@/components/dashboard/widgets/WidgetSkeletons";

const DashboardSortableGridLazy = dynamic(
  () => import("@/components/dashboard/DashboardSortableGrid").then((m) => m.DashboardSortableGrid),
  { ssr: false },
);

function WidgetBoundary({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return <WidgetErrorBoundary onReset={onReset}>{children}</WidgetErrorBoundary>;
}

export default function AnalyticsDashboard() {
  const { activeBranchId } = useAuth();
  const analyticsBranch = activeBranchId != null ? String(activeBranchId) : "ALL";

  const defaultLayout = ["sales", "topBranch", "lowStock", "topProducts", "salesChart"];
  const [widgetOrder, setWidgetOrder] = useState<string[]>(defaultLayout);

  useEffect(() => {
    const savedLayout = localStorage.getItem("executive_dashboard_layout");
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (!parsed.includes("salesChart")) {
          parsed.push("salesChart");
        }
        setWidgetOrder(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const { data: branches = [] } = useBranches();

  const branchLabel =
    activeBranchId != null
      ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name ?? `Branch #${activeBranchId}`
      : "All Branches (HQ)";

  const handleReorder = useCallback((newOrder: string[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem("executive_dashboard_layout", JSON.stringify(newOrder));
  }, []);

  const getWidgetClassName = useCallback(
    (id: string) => (id === "topProducts" || id === "salesChart" ? "xl:col-span-2" : ""),
    [],
  );

  const renderWidget = useCallback(
    (id: string, reset: () => void) => {
      switch (id) {
        case "sales":
          return (
            <WidgetBoundary onReset={reset}>
              <Suspense fallback={<StatWidgetSkeleton />}>
                <SalesWidget branchId={analyticsBranch} />
              </Suspense>
            </WidgetBoundary>
          );
        case "topBranch":
          return (
            <WidgetBoundary onReset={reset}>
              <Suspense fallback={<StatWidgetSkeleton />}>
                <TopBranchWidget branchId={analyticsBranch} />
              </Suspense>
            </WidgetBoundary>
          );
        case "lowStock":
          return (
            <WidgetBoundary onReset={reset}>
              <Suspense fallback={<AlertsWidgetSkeleton />}>
                <LowStockWidget branchId={analyticsBranch} />
              </Suspense>
            </WidgetBoundary>
          );
        case "topProducts":
          return (
            <WidgetBoundary onReset={reset}>
              <Suspense fallback={<ChartWidgetSkeleton />}>
                <TopProductsWidget branchId={analyticsBranch} />
              </Suspense>
            </WidgetBoundary>
          );
        case "salesChart":
          return (
            <WidgetBoundary onReset={reset}>
              <Suspense fallback={<ChartWidgetSkeleton />}>
                <SalesChartWidget branchId={analyticsBranch} />
              </Suspense>
            </WidgetBoundary>
          );
        default:
          return null;
      }
    },
    [analyticsBranch],
  );

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Drag widgets from the top right corner to customize layout.</p>
        </div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
          Viewing: <span className="text-emerald-600 dark:text-emerald-400">{branchLabel}</span>
        </div>
      </div>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <DashboardSortableGridLazy
            widgetOrder={widgetOrder}
            onReorder={handleReorder}
            renderWidget={(id) => renderWidget(id, reset)}
            getWidgetClassName={getWidgetClassName}
          />
        )}
      </QueryErrorResetBoundary>
    </AnimatedPage>
  );
}
