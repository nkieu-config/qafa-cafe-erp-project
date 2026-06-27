"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSalesTrendsSuspense } from "@/hooks/domains/useReportsQueries";

const SalesChart = dynamic(
  () => import("@/components/dashboard/SalesChart").then((m) => m.SalesChart),
  {
    ssr: false,
    loading: () => <div className="h-[350px] w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl" />,
  },
);

export function SalesChartWidget({ branchId }: { branchId: string }) {
  const { data: salesTrends } = useSalesTrendsSuspense(branchId);

  return (
    <Card className="glass-card h-[400px] flex flex-col border-purple-200 dark:border-purple-900/50">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="text-purple-600 dark:text-purple-500 text-2xl font-black">Revenue Overview</CardTitle>
        <CardDescription className="text-slate-500 font-medium text-sm">7-day performance trend</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <SalesChart data={salesTrends ?? []} />
      </CardContent>
    </Card>
  );
}
