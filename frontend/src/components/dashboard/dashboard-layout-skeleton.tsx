import { cn } from "@/lib/utils";
import {
  StatWidgetSkeleton,
  AlertsWidgetSkeleton,
  ChartWidgetSkeleton,
} from "@/components/dashboard/widgets/WidgetSkeletons";

export function DashboardLayoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
      <StatWidgetSkeleton />
      <StatWidgetSkeleton />
      <AlertsWidgetSkeleton />
      <ChartWidgetSkeleton className="lg:col-span-2 2xl:col-span-2" />
      <ChartWidgetSkeleton className={cn("lg:col-span-2 2xl:col-span-2")} />
    </div>
  );
}
