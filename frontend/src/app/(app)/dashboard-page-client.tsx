"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useAuth } from "@/context/AuthContext";
import { AnimatedPage } from "@/components/animated-page";
import { PageChrome } from "@/components/layout/PageChrome";
import { dashboardShellIconClassName, dashboardSkeletonClass } from "@/lib/theme";
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
  ChartWidgetSkeleton,
} from "@/components/dashboard/widgets/WidgetSkeletons";
import { DashboardLayoutSkeleton } from "@/components/dashboard/dashboard-layout-skeleton";

const DashboardSortableGridLazy = dynamic(
  () => import("@/components/dashboard/DashboardSortableGrid").then((m) => m.DashboardSortableGrid),
  { ssr: false },
);

const DEFAULT_LAYOUT = ["sales", "topBranch", "lowStock", "topProducts", "salesChart"];
const VALID_WIDGET_IDS = new Set(DEFAULT_LAYOUT);
const LAYOUT_PARAM = "layout";
const LAYOUT_STORAGE_KEY = "executive_dashboard_layout";

function normalizeLayout(ids: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of ids) {
    if (VALID_WIDGET_IDS.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const id of DEFAULT_LAYOUT) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

function parseLayoutParam(value: string | null): string[] | null {
  if (!value) return null;
  const ids = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (ids.length === 0) return null;
  return normalizeLayout(ids);
}

function readStoredLayout(): string[] | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return null;
    return normalizeLayout(parsed.map(String));
  } catch {
    return null;
  }
}

function WidgetBoundary({
  children,
  onReset,
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return <WidgetErrorBoundary onReset={onReset}>{children}</WidgetErrorBoundary>;
}

function AnalyticsDashboardContent() {
  const { activeBranchId, user } = useAuth();
  const analyticsBranch = activeBranchId != null ? String(activeBranchId) : "ALL";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_LAYOUT);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    const fromUrl = parseLayoutParam(searchParams.get(LAYOUT_PARAM));
    if (fromUrl) {
      setWidgetOrder(fromUrl);
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(fromUrl));
      setLayoutReady(true);
      return;
    }

    const fromStorage = readStoredLayout() ?? DEFAULT_LAYOUT;
    setWidgetOrder(fromStorage);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(fromStorage));

    const serialized = fromStorage.join(",");
    if (searchParams.get(LAYOUT_PARAM) !== serialized) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(LAYOUT_PARAM, serialized);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    setLayoutReady(true);
  }, [pathname, router, searchParams]);

  const { data: branches = [] } = useBranches();

  const branchName =
    activeBranchId != null
      ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name
      : undefined;

  const handleReorder = useCallback(
    (newOrder: string[]) => {
      const normalized = normalizeLayout(newOrder);
      setWidgetOrder(normalized);
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(normalized));

      const serialized = normalized.join(",");
      if (searchParams.get(LAYOUT_PARAM) !== serialized) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(LAYOUT_PARAM, serialized);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const getWidgetClassName = useCallback(
    (id: string) =>
      id === "topProducts" || id === "salesChart" ? "lg:col-span-2 2xl:col-span-2" : "",
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
                <TopBranchWidget branchId={analyticsBranch} branchName={branchName} />
              </Suspense>
            </WidgetBoundary>
          );
        case "lowStock":
          return (
            <WidgetBoundary onReset={reset}>
              <LowStockWidget branchId={analyticsBranch} />
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
    [analyticsBranch, branchName],
  );

  const dashboardDescription =
    user?.role === "SUPER_ADMIN"
      ? "Drag the handle on each widget to customize layout. Data reflects the branch selected in the top bar."
      : "Drag the handle at the top-right of each widget to customize layout.";

  return (
    <AnimatedPage className="w-full h-full flex flex-col">
      <PageChrome
        title="Dashboard"
        icon={LayoutDashboard}
        iconClassName={dashboardShellIconClassName()}
        description={dashboardDescription}
        branchScope={{
          branchName,
          allBranches: activeBranchId == null,
        }}
      >
        {layoutReady ? (
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
      ) : (
        <DashboardLayoutSkeleton />
      )}
      </PageChrome>
    </AnimatedPage>
  );
}

export default function AnalyticsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className={dashboardSkeletonClass("h-20")} />
          <DashboardLayoutSkeleton />
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  );
}
