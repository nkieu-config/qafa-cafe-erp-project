import type { HubId } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { MetricTone } from "./metric";
import { metricValueClassName } from "./metric";
import type { StatusTone } from "./status";
import { statusToneClassName } from "./status";
import { hubAccentIconClass, hubCardIconClass } from "./hub-accent";
import { text } from "./surface";

/** Primary CTA styled with the hub's accent color from tokens.css */
export function hubCtaClassName(hubId: HubId, className?: string) {
  const hubVar: Record<HubId, { bg: string; fg: string }> = {
    inventory: { bg: "--hub-inventory", fg: "--hub-inventory-fg" },
    procurement: { bg: "--hub-procurement", fg: "--hub-procurement-fg" },
    hr: { bg: "--hub-hr", fg: "--hub-hr-fg" },
    products: { bg: "--hub-products", fg: "--hub-products-fg" },
    kitchen: { bg: "--hub-kitchen", fg: "--hub-kitchen-fg" },
    crm: { bg: "--hub-crm", fg: "--hub-crm-fg" },
    finance: { bg: "--hub-finance", fg: "--hub-finance-fg" },
    assets: { bg: "--hub-assets", fg: "--hub-assets-fg" },
    pos: { bg: "--hub-pos", fg: "--hub-pos-fg" },
    settings: { bg: "--hub-settings", fg: "--hub-settings-fg" },
    organization: { bg: "--hub-organization", fg: "--hub-organization-fg" },
  };
  const { bg, fg } = hubVar[hubId];
  return cn(
    "hover:opacity-90 shadow-sm",
    `bg-[var(${bg})] text-[var(${fg})]`,
    className,
  );
}

export function hubCardIconFor(hubId: HubId, className?: string) {
  return cn(hubCardIconClass(hubId), className);
}

const hubSummaryToneVar: Record<HubId, { subtle: string; border: string }> = {
  inventory: { subtle: "--tone-inventory-subtle", border: "--tone-inventory-border" },
  procurement: { subtle: "--tone-procurement-subtle", border: "--tone-procurement-border" },
  hr: { subtle: "--tone-hr-subtle", border: "--tone-hr-border" },
  products: { subtle: "--tone-products-subtle", border: "--tone-products-border" },
  kitchen: { subtle: "--tone-kitchen-subtle", border: "--tone-kitchen-border" },
  crm: { subtle: "--tone-crm-subtle", border: "--tone-crm-border" },
  finance: { subtle: "--tone-finance-subtle", border: "--tone-finance-border" },
  assets: { subtle: "--tone-assets-subtle", border: "--tone-assets-border" },
  pos: { subtle: "--tone-pos-subtle", border: "--tone-pos-border" },
  settings: { subtle: "--tone-settings-subtle", border: "--tone-settings-border" },
  organization: { subtle: "--tone-organization-subtle", border: "--tone-organization-border" },
};

/** Hub-aware inline summary chip (count line badges, optional filter toggles). */
export function summaryChipClassName(hubId: HubId, active = false, className?: string) {
  const tone = hubSummaryToneVar[hubId];
  return cn(
    "rounded-md px-2 py-0.5 font-medium tabular-nums transition-colors",
    active
      ? `bg-[var(${tone.subtle})] ring-1 ring-[var(${tone.border})]`
      : `hover:bg-[var(${tone.subtle})] cursor-pointer`,
    className,
  );
}

/** @deprecated Use summaryChipClassName("kitchen", ...) */
export function kitchenSummaryChipClassName(active = false, className?: string) {
  return summaryChipClassName("kitchen", active, className);
}

export function tableActionAccentClassName(tone: MetricTone, className?: string) {
  return cn(metricValueClassName(tone), "font-bold", className);
}

export function foodCostStatusMetricTone(status: "good" | "warn" | "bad"): MetricTone {
  switch (status) {
    case "good":
      return "emerald";
    case "warn":
      return "amber";
    default:
      return "red";
  }
}

export function foodCostStatusClassName(status: "good" | "warn" | "bad", className?: string) {
  return cn("font-bold tabular-nums", metricValueClassName(foodCostStatusMetricTone(status)), className);
}

export function inlineLinkClassName(className?: string) {
  return cn("font-medium text-[var(--brand-text)] hover:opacity-80", className);
}

export function expandedRowPanelClassName(className?: string) {
  return cn(
    "p-4 rounded-lg m-2 border",
    "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
    className,
  );
}

export function formSectionClassName(className?: string) {
  return cn(
    "p-4 rounded-xl border mb-6",
    "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
    className,
  );
}

export function infoBannerClassName(className?: string) {
  return cn(
    "rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3",
    "bg-[var(--status-info-bg)] border-[var(--status-info-fg)]/20",
    className,
  );
}

export function infoBannerIconClassName(className?: string) {
  return cn("w-5 h-5 mt-0.5 shrink-0 text-[var(--status-info-fg)]", className);
}

export function infoBannerTitleClassName(className?: string) {
  return cn("font-semibold text-[var(--status-info-fg)]", className);
}

export function infoBannerTextClassName(className?: string) {
  return cn("text-sm opacity-80 text-[var(--status-info-fg)]", className);
}

export function warningBannerClassName(className?: string) {
  return cn(
    "rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
    "bg-[var(--status-warning-bg)] border-[var(--status-warning-fg)]/20",
    className,
  );
}

export function warningBannerPanelClassName(className?: string) {
  return cn(
    "rounded-xl border p-10 text-center max-w-lg mx-auto w-full",
    "flex flex-col items-center",
    "bg-[var(--status-warning-bg)] border-[var(--status-warning-fg)]/20",
    className,
  );
}

export function warningBannerIconClassName(className?: string) {
  return cn("w-5 h-5 shrink-0 text-[var(--status-warning-fg)]", className);
}

export function warningBannerTitleClassName(className?: string) {
  return cn("font-semibold text-[var(--status-warning-fg)]", className);
}

export function warningBannerTextClassName(className?: string) {
  return cn("text-sm opacity-80 text-[var(--status-warning-fg)]", className);
}

export function productionColumnTone(status: string): StatusTone {
  switch (status) {
    case "PLANNED":
      return "info";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
    default:
      return "neutral";
  }
}

export function kanbanColumnClassName(isOver: boolean, className?: string) {
  return cn(
    "flex flex-col min-w-[320px] max-w-[350px] flex-1 rounded-2xl border overflow-hidden transition-colors",
    "bg-[var(--form-line-bg)]",
    isOver
      ? "border-[var(--hub-kitchen)] bg-[var(--status-warning-bg)]/30"
      : "border-[var(--table-container-border)]",
    className,
  );
}

export function kanbanColumnHeaderClassName(tone: StatusTone, className?: string) {
  return cn(
    "p-4 border-b font-black flex items-center justify-between",
    "border-[var(--table-container-border)]",
    statusToneClassName(tone),
    className,
  );
}

export function kanbanCardClassName(isOverlay?: boolean, className?: string) {
  return cn(
    "p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    isOverlay && "shadow-xl scale-105 rotate-2",
    className,
  );
}

export function kanbanOrderBadgeClassName(className?: string) {
  return cn(
    "text-xs font-bold font-mono px-2 py-0.5 rounded-md",
    "text-muted-foreground bg-[var(--table-head-bg)]",
    className,
  );
}

export function kanbanMetaChipClassName(className?: string) {
  return cn(
    "mt-3 text-xs flex items-center gap-1 font-medium w-fit px-2 py-1 rounded-md",
    text.subtle,
    "bg-[var(--form-line-bg)]",
    className,
  );
}

export function branchCardClassName(hubId: HubId = "organization", className?: string) {
  const hubVar: Record<HubId, string> = {
    inventory: "--hub-inventory",
    procurement: "--hub-procurement",
    hr: "--hub-hr",
    products: "--hub-products",
    kitchen: "--hub-kitchen",
    crm: "--hub-crm",
    finance: "--hub-finance",
    assets: "--hub-assets",
    pos: "--hub-pos",
    settings: "--hub-settings",
    organization: "--hub-organization",
  };
  return cn(
    "rounded-xl shadow-sm border p-6 flex flex-col transition-colors",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    `hover:border-[var(${hubVar[hubId]})]/50`,
    className,
  );
}

export function emptyStatePanelClassName(className?: string) {
  return cn(
    "rounded-xl border border-dashed p-12 text-center",
    "border-[var(--table-container-border)] bg-[var(--table-container-bg)]",
    className,
  );
}

export function avatarPlaceholderClassName(className?: string) {
  return cn(
    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
    "bg-[var(--table-head-bg)]",
    className,
  );
}

export function foodCostProgressIndicatorClassName(isWarning: boolean, className?: string) {
  return cn(
    isWarning ? "bg-[var(--metric-red)]" : "bg-[var(--metric-emerald)]",
    className,
  );
}

export function formDashedButtonClassName(className?: string) {
  return cn("font-bold border-[var(--form-line-border)]", className);
}

export function settingsSectionClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-6 space-y-6",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function settingsSectionHeaderClassName(className?: string) {
  return cn(
    "flex items-center gap-2 border-b pb-4 border-[var(--table-row-border)]",
    className,
  );
}

export function settingsSectionTitleClassName(className?: string) {
  return cn("font-semibold text-lg", text.primary, className);
}

export function statusInlineAlertClassName(tone: StatusTone, className?: string) {
  return cn(
    "rounded-xl border px-4 py-3 text-sm font-medium",
    statusToneClassName(tone),
    className,
  );
}

export function receiveLineClassName(className?: string) {
  return cn(
    "flex items-center justify-between gap-4 border-b pb-3 border-[var(--table-row-border)]",
    className,
  );
}

export function ganttPanelClassName(className?: string) {
  return cn(
    "rounded-2xl shadow-sm border overflow-hidden flex flex-col",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function ganttHeaderClassName(className?: string) {
  return cn(
    "p-4 border-b flex justify-between items-center",
    "bg-[var(--table-head-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function ganttTimeAxisClassName(className?: string) {
  return cn("flex ml-40 border-b pb-2 relative border-[var(--table-row-border)]", className);
}

export function ganttHourLabelClassName(className?: string) {
  return cn("flex-1 text-xs font-black text-center relative", text.muted, className);
}

export function ganttHourMarkerClassName(className?: string) {
  return cn(
    "absolute top-0 px-1 z-10 bg-[var(--table-container-bg)]",
    className,
  );
}

export function ganttGridLineClassName(className?: string) {
  return cn("flex-1 border-l border-dashed border-[var(--table-row-border)]", className);
}

export function ganttUserColumnClassName(className?: string) {
  return cn(
    "w-40 flex items-center gap-2 pr-4 shrink-0 border-r z-10 transition-colors",
    "border-[var(--table-row-border)] bg-[var(--table-container-bg)] group-hover:bg-[var(--table-row-hover)]",
    className,
  );
}

export function ganttTrackClassName(className?: string) {
  return cn(
    "flex-1 h-full relative transition-colors rounded-r-xl group-hover:bg-[var(--table-row-hover)]",
    className,
  );
}

export type ShiftBarStatus = "scheduled" | "COMPLETED" | "ABSENT" | "CANCELLED";

const shiftBarClass: Record<ShiftBarStatus, string> = {
  scheduled:
    "bg-[var(--status-info-bg)] border-[var(--status-info-fg)]/30 text-[var(--status-info-fg)]",
  COMPLETED:
    "bg-[var(--metric-emerald)] border-[var(--metric-emerald)] text-[var(--on-metric-emerald-fg)]",
  ABSENT:
    "bg-[var(--metric-red)] border-[var(--metric-red)] text-[var(--on-metric-red-fg)]",
  CANCELLED:
    "bg-[var(--status-neutral-bg)] border-[var(--tone-neutral-border)] text-[var(--status-neutral-fg)]",
};

function shiftBarStatusKey(status: string): ShiftBarStatus {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "ABSENT") return "ABSENT";
  if (status === "CANCELLED") return "CANCELLED";
  return "scheduled";
}

export function shiftBarClassName(status: string, className?: string) {
  return cn(
    "absolute top-1 bottom-1 rounded-md border text-[10px] font-black",
    "flex items-center justify-center overflow-hidden shadow-sm",
    "transition-transform motion-reduce:transition-none hover:scale-[1.02] motion-reduce:hover:scale-100 cursor-pointer z-20",
    shiftBarClass[shiftBarStatusKey(status)],
    className,
  );
}

export function hrAvatarClassName(className?: string) {
  return cn(
    "font-bold shrink-0 bg-[var(--hub-hr)] text-[var(--hub-hr-fg)]",
    className,
  );
}

export function attendanceLateRowClassName(className?: string) {
  return cn("bg-[var(--status-danger-bg)]/50", className);
}

export function attendanceOnTimeClassName(className?: string) {
  return cn("font-mono font-bold", metricValueClassName("emerald"), className);
}

export function attendanceLateTimeClassName(className?: string) {
  return cn("font-mono font-bold", metricValueClassName("red"), className);
}

export function payrollExpandedPanelClassName(className?: string) {
  return expandedRowPanelClassName(className);
}

export function payrollSummaryRowClassName(className?: string) {
  return cn("font-bold bg-[var(--table-summary-bg)]", className);
}

export function crmSectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function productsSectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function productsCategoryBadgeClassName(className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    "bg-[var(--tone-products-subtle)] text-[var(--tone-products-fg)] border-[var(--tone-products-border)]",
    className,
  );
}

export function productsDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

export function procurementSectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function procurementMetaBadgeClassName(className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    "bg-[var(--tone-procurement-subtle)] text-[var(--tone-procurement-fg)] border-[var(--tone-procurement-border)]",
    className,
  );
}

export function procurementDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

export function kitchenSectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function kitchenMetaBadgeClassName(className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    "bg-[var(--tone-kitchen-subtle)] text-[var(--tone-kitchen-fg)] border-[var(--tone-kitchen-border)]",
    className,
  );
}

export function kitchenDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

export function hrSectionPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border p-4 sm:p-6 space-y-4",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function hrMetaBadgeClassName(className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
    "bg-[var(--tone-hr-subtle)] text-[var(--tone-hr-fg)] border-[var(--tone-hr-border)]",
    className,
  );
}

export function hrDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

/** @deprecated Use listToolbarFieldClassName from @/lib/theme instead. */
export function crmSearchInputClassName(className?: string) {
  return cn(
    "pl-9 bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function crmPointsClassName(className?: string) {
  return cn("font-black text-lg", metricValueClassName("emerald"), className);
}

export function crmPointsSuffixClassName(className?: string) {
  return cn("text-xs font-bold opacity-70", metricValueClassName("emerald"), className);
}

export function crmInsightPanelClassName(className?: string) {
  return cn(
    "rounded-2xl p-5 border",
    "bg-[var(--form-line-bg)] border-[var(--form-line-border)]",
    className,
  );
}

export function crmSectionLabelClassName(className?: string) {
  return cn("text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2", text.muted, className);
}

export function crmFavoriteChipClassName(className?: string) {
  return cn(
    "flex items-center gap-2 px-3 py-1.5 rounded-full border",
    "bg-[var(--tone-crm-subtle)] border-[var(--tone-crm-border)]",
    className,
  );
}

export function crmFavoriteCountClassName(className?: string) {
  return cn(
    "text-xs font-black px-2 py-0.5 rounded-full tabular-nums",
    "bg-[var(--tone-crm-border)] text-[var(--tone-crm-fg)]",
    className,
  );
}

export function crmOrderCardClassName(className?: string) {
  return cn(
    "flex justify-between items-center p-3 rounded-xl border shadow-sm",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)]",
    className,
  );
}

export function crmOrderIconWrapClassName(className?: string) {
  return cn("p-2 rounded-lg bg-[var(--table-head-bg)]", text.muted, className);
}

export function crmMaxTierBadgeClassName(className?: string) {
  return cn(
    "mt-3 text-sm font-bold p-2 rounded-lg text-center uppercase tracking-wider",
    statusToneClassName("purple"),
    className,
  );
}

export function crmProgressClassName(className?: string) {
  return cn(
    "h-2 mt-3",
    "[&_[data-slot=progress-track]]:bg-[var(--form-line-bg)]",
    "[&_[data-slot=progress-indicator]]:bg-[var(--hub-crm)]",
    className,
  );
}

export function crmSheetContentClassName(className?: string) {
  return cn(
    "bg-[var(--table-container-bg)] text-foreground border-[var(--table-container-border)]",
    className,
  );
}

export function crmDialogContentClassName(className?: string) {
  return cn(
    "sm:max-w-md rounded-2xl",
    "bg-[var(--table-container-bg)] border-[var(--table-container-border)] text-foreground",
    className,
  );
}

export function modifierGroupPanelClassName(className?: string) {
  return cn(
    "rounded-xl border p-5 space-y-4 mb-4 last:mb-0",
    "border-[var(--table-container-border)] bg-[var(--form-line-bg)]",
    className,
  );
}

export function hubLoadingSpinnerClassName(className?: string) {
  return cn("animate-spin motion-reduce:animate-none", metricValueClassName("emerald"), className);
}

export function customerTierTone(tier: string): StatusTone {
  switch (tier?.toUpperCase()) {
    case "PLATINUM":
      return "purple";
    case "GOLD":
      return "warning";
    case "SILVER":
      return "neutral";
    default:
      return "info";
  }
}

export function churnRiskTone(risk: string): StatusTone {
  switch (risk?.toUpperCase()) {
    case "LOW":
      return "success";
    case "MEDIUM":
      return "warning";
    case "HIGH":
      return "danger";
    default:
      return "neutral";
  }
}

export function customerTierIconClassName(tier: string, className?: string) {
  switch (tier?.toUpperCase()) {
    case "PLATINUM":
      return cn(metricValueClassName("purple"), className);
    case "GOLD":
      return cn(metricValueClassName("amber"), className);
    case "SILVER":
      return cn(text.muted, className);
    default:
      return cn(metricValueClassName("blue"), className);
  }
}
