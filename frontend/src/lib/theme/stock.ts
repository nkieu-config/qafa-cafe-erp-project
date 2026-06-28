import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { MetricTone } from "./metric";
import { metricValueClassName } from "./metric";
import type { StatusTone } from "./status";
import { hubCardIconClass } from "./hub-accent";
import { summaryChipClassName } from "./hub-ui";
import { text } from "./surface";

export type StockLevel = "out" | "low" | "ok";

export type ExpiryUrgency = "expired" | "critical" | "warning" | "notice" | "safe";

export function stockLevel(stock: number, minStock: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "ok";
}

export function stockLevelMetricTone(level: StockLevel): MetricTone {
  switch (level) {
    case "out":
      return "red";
    case "low":
      return "amber";
    default:
      return "emerald";
  }
}

export function stockLevelStatusTone(level: StockLevel): StatusTone {
  switch (level) {
    case "out":
      return "danger";
    case "low":
      return "warning";
    default:
      return "success";
  }
}

export function stockLevelLabel(level: StockLevel): string {
  switch (level) {
    case "out":
      return "Out of Stock";
    case "low":
      return "Low Stock";
    default:
      return "In Stock";
  }
}

export function stockLevelValueClassName(level: StockLevel, className?: string) {
  return cn("font-bold tabular-nums", metricValueClassName(stockLevelMetricTone(level)), className);
}

export function stockLevelIconClassName(level: StockLevel, className?: string) {
  if (level === "ok") return className ?? "";
  return cn(metricValueClassName(stockLevelMetricTone(level)), className);
}

export function expiryUrgency(daysLeft: number): ExpiryUrgency {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 3) return "warning";
  if (daysLeft <= 7) return "notice";
  return "safe";
}

const expiryCellClass: Record<ExpiryUrgency, string> = {
  expired: "bg-[var(--expiry-expired-bg)] text-[var(--expiry-expired-fg)]",
  critical:
    "bg-[var(--expiry-critical-bg)] text-[var(--expiry-critical-fg)] shadow-[var(--expiry-critical-bg)]/50 shadow-md",
  warning: "bg-[var(--expiry-warning-bg)] text-[var(--expiry-warning-fg)] shadow-[var(--expiry-warning-bg)]/30 shadow-md",
  notice: "bg-[var(--expiry-notice-bg)] text-[var(--expiry-notice-fg)]",
  safe: "bg-[var(--expiry-safe-bg)] text-[var(--expiry-safe-fg)]",
};

export function expiryCellClassName(urgency: ExpiryUrgency, className?: string) {
  return cn(
    "w-full h-full flex flex-col items-center justify-center rounded-lg p-1 mt-1 cursor-pointer transition-transform hover:scale-110 motion-reduce:hover:scale-100",
    expiryCellClass[urgency],
    className,
  );
}

export function expiryLegendDotClassName(urgency: ExpiryUrgency, className?: string) {
  const base = "w-3 h-3 rounded-full shadow-sm";
  switch (urgency) {
    case "expired":
      return cn(base, "bg-[var(--expiry-expired-bg)]", className);
    case "critical":
      return cn(base, "bg-[var(--expiry-critical-bg)] shadow-[var(--expiry-critical-bg)]", className);
    case "warning":
      return cn(base, "bg-[var(--expiry-warning-bg)] shadow-[var(--expiry-warning-bg)]", className);
    case "notice":
      return cn(base, "bg-[var(--expiry-notice-bg)]", className);
    case "safe":
      return cn(base, "bg-[var(--expiry-safe-bg)]", className);
    default:
      return cn(base, className);
  }
}

export function batchExpiryDaysLeft(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

export function batchExpiryUrgency(expiryDate: string | null | undefined): ExpiryUrgency | null {
  const daysLeft = batchExpiryDaysLeft(expiryDate);
  if (daysLeft === null) return null;
  return expiryUrgency(daysLeft);
}

export function expiryUrgencyLabel(urgency: ExpiryUrgency): string {
  switch (urgency) {
    case "expired":
      return "Expired";
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "notice":
      return "Notice";
    default:
      return "Safe";
  }
}

export function expiryUrgencyStatusTone(urgency: ExpiryUrgency): StatusTone {
  switch (urgency) {
    case "expired":
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    case "notice":
      return "info";
    default:
      return "success";
  }
}

export function expiryDateTextClassName(urgency: ExpiryUrgency | null, className?: string) {
  if (!urgency || urgency === "safe") {
    return cn("text-sm font-medium", text.subtle, className);
  }
  const tokenClass: Record<Exclude<ExpiryUrgency, "safe">, string> = {
    expired: "text-[var(--expiry-expired-fg)]",
    critical: "text-[var(--expiry-critical-fg)]",
    warning: "text-[var(--expiry-warning-fg)]",
    notice: "text-[var(--expiry-notice-fg)]",
  };
  return cn("text-sm font-medium", tokenClass[urgency], className);
}

export function formLineRowClassName(className?: string) {
  return cn(
    "flex flex-col sm:flex-row sm:items-end gap-4 p-4 rounded-lg border",
    "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
    className,
  );
}

export function formLineFieldClassName(className?: string) {
  return cn("flex-1 min-w-0 w-full space-y-2", className);
}

export function formLineQtyFieldClassName(className?: string) {
  return cn("w-full sm:w-32 space-y-2 shrink-0", className);
}

export function formLineDateFieldClassName(className?: string) {
  return cn("w-full sm:w-48 space-y-2 shrink-0", className);
}

export function formLineReasonFieldClassName(className?: string) {
  return cn("w-full sm:w-64 space-y-2 shrink-0", className);
}

export function inventorySummaryStripClassName(className?: string) {
  return cn(
    "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-1 pb-3 border-b",
    "border-[var(--table-row-border)]",
    className,
  );
}

/** @deprecated Use summaryChipClassName("inventory", ...) from @/lib/theme */
export function inventorySummaryChipClassName(active = false, className?: string) {
  return summaryChipClassName("inventory", active, className);
}

export function inventorySectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function formRemoveButtonClassName(className?: string) {
  return cn(
    "text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)]",
    className,
  );
}

export function formPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 w-full",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function formPanelHeaderClassName(className?: string) {
  return cn(
    "mb-6 border-b pb-4 border-[var(--table-row-border)]",
    className,
  );
}

export function formFieldInsetClassName(className?: string) {
  return cn("form-field-inset h-11 rounded-xl", className);
}

export function formSelectContentClassName(className?: string) {
  return cn("form-select-content", className);
}

/** Read-only source context banner inside transfer/create modals. */
export function formSourceBannerClassName(className?: string) {
  return cn(
    "text-sm rounded-lg px-3 py-2.5 border",
    "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
    className,
  );
}

export function expiryHeatmapPanelClassName(className?: string) {
  return cn(
    "rounded-2xl shadow-sm border p-1 h-full",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function expiryHeatmapHeaderClassName(className?: string) {
  return cn(
    "p-4 rounded-t-xl font-black flex items-center gap-2",
    "bg-[var(--expiry-panel-header-bg)] text-[var(--expiry-panel-header-fg)]",
    className,
  );
}

/** Ant Design Calendar shell — CSS-variable bridge for instant light/dark sync (see utilities.css). */
export function expiryCalendarShellClassName(className?: string) {
  return cn("expiry-calendar-shell", className);
}

export function expiryHeatmapPopoverClassName(className?: string) {
  return cn("expiry-heatmap-popover", className);
}

export function inventoryLinkCardClassName(className?: string) {
  return cn(
    "flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition-colors",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    "hover:border-[var(--brand)]",
    className,
  );
}

export function inventoryLinkIconWrapClassName(className?: string) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--status-success-bg)]",
    className,
  );
}

export function inventoryHubIconClassName(className?: string) {
  return cn(hubCardIconClass("inventory"), className);
}

export function procurementHubIconClassName(className?: string) {
  return cn(hubCardIconClass("procurement"), className);
}

export function hubPrimaryActionClassName(className?: string) {
  return cn(
    "bg-[var(--brand-solid)] text-[var(--on-brand-solid-fg)] hover:opacity-90 shadow-sm",
    className,
  );
}

export function hubDangerActionClassName(className?: string) {
  return cn(
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    className,
  );
}

export function hubInfoActionClassName(className?: string) {
  return cn(
    "bg-[var(--metric-indigo)] text-[var(--on-metric-indigo-fg)] hover:opacity-90",
    className,
  );
}

export function compactPanelLinkClassName(className?: string) {
  return cn(
    "inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md",
    text.subtle,
    "hover:text-foreground hover:bg-[var(--table-row-hover)]",
    className,
  );
}
