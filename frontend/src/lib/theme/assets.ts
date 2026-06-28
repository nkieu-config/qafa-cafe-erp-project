import { cn } from "@/lib/utils";
import { elevatedPanelClassName } from "./surface";
import { hubCardIconClass } from "./hub-accent";
import { metricValueClassName } from "./metric";
import { text } from "./surface";

export function assetsSectionPanelClassName(className?: string) {
  return elevatedPanelClassName(cn("p-4 sm:p-6 space-y-4", className));
}

export function assetsHubIconClassName(className?: string) {
  return cn(hubCardIconClass("assets"), className);
}

export function assetsMetaBadgeClassName(className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    "bg-[var(--tone-assets-subtle)] text-[var(--tone-assets-fg)] border-[var(--tone-assets-border)]",
    className,
  );
}

export function assetsDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

export function equipmentMaintenanceDueRowClassName(className?: string) {
  return cn("bg-[var(--status-warning-bg)]/45", className);
}

export function equipmentMaintenanceOverdueRowClassName(className?: string) {
  return cn("bg-[var(--status-danger-bg)]/45", className);
}

export function equipmentMaintenanceDateClassName(
  overdue: boolean,
  dueSoon: boolean,
  className?: string,
) {
  if (overdue) {
    return cn("font-medium tabular-nums", metricValueClassName("red"), className);
  }
  if (dueSoon) {
    return cn("font-medium tabular-nums", metricValueClassName("amber"), className);
  }
  return cn("tabular-nums", text.muted, className);
}
