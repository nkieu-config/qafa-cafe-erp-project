"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Store, AlertTriangle, CheckCircle2, Award } from "lucide-react";
import { useAnalyticsSummarySuspense, useTopProductsSuspense } from "@/hooks/domains/useReportsQueries";
import { formatDashboardCurrency } from "./format-currency";

const TopProductsChart = dynamic(
  () => import("@/components/dashboard/TopProductsChart").then((m) => m.TopProductsChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl" />,
  },
);

export function SalesWidget({ branchId }: { branchId: string }) {
  const { data: summary } = useAnalyticsSummarySuspense(branchId);

  return (
    <Card className="glass-card bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/20 h-full border-emerald-200 dark:border-emerald-800/50 shadow-emerald-100/50 dark:shadow-emerald-900/20">
      <CardContent className="p-8 h-full flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Today&apos;s Sales</p>
            <h3 className="text-4xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{formatDashboardCurrency(summary?.salesToday || 0)}</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className={`flex items-center text-sm font-bold px-2 py-1 rounded ${summary?.salesGrowth >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"}`}>
                {summary?.salesGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(summary?.salesGrowth || 0).toFixed(1)}%
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">vs yesterday</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopBranchWidget({ branchId }: { branchId: string }) {
  const { data: summary } = useAnalyticsSummarySuspense(branchId);

  return (
    <Card className="glass-card bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20 h-full border-blue-200 dark:border-blue-900/50">
      <CardContent className="p-8 h-full flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Top Branch Today</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{summary?.topBranch?.name || "N/A"}</h3>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-2">{formatDashboardCurrency(summary?.topBranch?.totalSales || 0)}</div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 shadow-inner">
            <Store className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LowStockWidget({ branchId }: { branchId: string }) {
  const { data: summary } = useAnalyticsSummarySuspense(branchId);

  return (
    <Card className="glass-card bg-gradient-to-br from-white to-rose-50/50 dark:from-slate-900 dark:to-rose-900/20 h-[300px] overflow-hidden flex flex-col border-rose-200 dark:border-rose-900/50">
      <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-900/50 shrink-0">
        <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" /> Inventory Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {summary?.lowStockAlerts?.length > 0 || summary?.expiryAlerts?.length > 0 ? (
          <div className="divide-y divide-rose-100 dark:divide-rose-900/30">
            {summary?.lowStockAlerts?.map((alert: { id: string; ingredientName: string; stock: number; minStock: number; branchName: string }) => (
              <div key={`low-${alert.id}`} className="p-4 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/10">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{alert.ingredientName}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{alert.branchName} · Low stock</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-600 dark:text-rose-400 text-xl">{alert.stock}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500">Min: {alert.minStock}</div>
                </div>
              </div>
            ))}
            {summary?.expiryAlerts?.map((alert: { id: number; ingredientName: string; branchName: string; quantity: number; expiryDate: string; status: string }) => (
              <div key={`exp-${alert.id}`} className="p-4 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{alert.ingredientName}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {alert.branchName} · {alert.status === "EXPIRED" ? "Expired batch" : "Expiring soon"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-600 dark:text-amber-400 text-xl">{alert.quantity}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-500">{new Date(alert.expiryDate).toLocaleDateString("th-TH")}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center h-full">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <span className="font-bold text-lg text-emerald-600">Stock and expiry levels look healthy.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopProductsWidget({ branchId }: { branchId: string }) {
  const { data: topProducts } = useTopProductsSuspense(branchId);

  return (
    <Card className="glass-card h-[400px] flex flex-col border-amber-200 dark:border-amber-900/50">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-2xl font-black">
          <Award className="w-6 h-6" /> Top 5 Best Sellers
        </CardTitle>
        <CardDescription className="text-slate-500 font-medium text-sm">Highest volume items today</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-4">
        <TopProductsChart data={topProducts ?? []} />
      </CardContent>
    </Card>
  );
}
