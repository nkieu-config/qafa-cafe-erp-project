import { dashboardSkeletonClass } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function StatWidgetSkeleton() {
  return <div className={dashboardSkeletonClass("h-full min-h-[180px]")} />;
}

export function AlertsWidgetSkeleton() {
  return <div className={dashboardSkeletonClass("h-[300px]")} />;
}

export function ChartWidgetSkeleton({ className }: { className?: string }) {
  return <div className={dashboardSkeletonClass(cn("h-[400px]", className))} />;
}
