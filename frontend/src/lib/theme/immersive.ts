import { cn } from "@/lib/utils";
import { dashboardErrorPanelClass } from "./dashboard";
import { statusToneClassName, text } from "./index";

export type KdsTicketUrgency = "on-time" | "warning" | "late";

const kdsTicketBorder: Record<KdsTicketUrgency, string> = {
  "on-time": "border-[var(--kds-on-time-border)]",
  warning: "border-[var(--kds-warning-border)]",
  late: "border-[var(--kds-late-border)] animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none",
};

const kdsTicketHeader: Record<KdsTicketUrgency, string> = {
  "on-time": "bg-[var(--kds-on-time-header)]",
  warning: "bg-[var(--kds-warning-header)]",
  late: "bg-[var(--kds-late-header)]",
};

export function posProductCardClassName(className?: string) {
  return cn(
    "ring-0 shadow-none cursor-default transition-colors",
    "bg-[var(--pos-panel-bg)] border-[var(--pos-panel-border)]",
    "hover:border-[var(--pos-accent-hover-border)] hover:shadow-md",
    className,
  );
}

export function posPriceClassName(className?: string) {
  return cn("font-bold tabular-nums text-lg text-[var(--pos-price-fg)]", className);
}

export function posAddButtonClassName(className?: string) {
  return cn(
    "bg-[var(--pos-accent-soft-bg)] text-[var(--pos-accent-soft-fg)]",
    "hover:opacity-90",
    className,
  );
}

export function posCartPanelClassName(className?: string) {
  return cn(
    "rounded-xl shadow-sm border flex flex-col h-full",
    "bg-[var(--pos-panel-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posFormPanelClassName(className?: string) {
  return cn(
    "p-6 rounded-2xl flex flex-col gap-6",
    "bg-[var(--pos-panel-bg)] border border-[var(--pos-panel-border)] shadow-[var(--shadow-sm)]",
    className,
  );
}

export function posCartHeaderClassName(className?: string) {
  return cn(
    "p-4 border-b flex items-center justify-between rounded-t-xl",
    "bg-[var(--pos-panel-header-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posCartSectionClassName(className?: string) {
  return cn(
    "border-t p-4 space-y-4 bg-[var(--pos-panel-muted-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posCartBadgeClassName(className?: string) {
  return cn(
    "px-3 py-1 rounded-full text-xs font-bold tabular-nums",
    "bg-[var(--pos-accent-soft-bg)] text-[var(--pos-accent-soft-fg)]",
    className,
  );
}

export function posAccentIconClassName(className?: string) {
  return cn("text-[var(--pos-accent)]", className);
}

export function posAccentTextClassName(className?: string) {
  return cn("text-[var(--pos-price-fg)]", className);
}

export function posSummaryPanelClassName(className?: string) {
  return cn(
    "p-5 rounded-b-xl space-y-2 border-t",
    "bg-[var(--pos-summary-bg)] text-[var(--pos-summary-fg)] border-[var(--pos-summary-divider)]",
    className,
  );
}

export function posSummaryMutedClassName(className?: string) {
  return cn("text-sm text-[var(--pos-summary-muted)]", className);
}

export function posSummaryTotalClassName(className?: string) {
  return cn("text-[var(--pos-summary-total)] tabular-nums", className);
}

export function posPrimaryActionClassName(className?: string) {
  return cn(
    "bg-[var(--brand-solid)] text-[var(--on-brand-solid-fg)] hover:opacity-90 shadow-lg",
    className,
  );
}

export function posPayActionClassName(className?: string) {
  return cn(
    "bg-[var(--brand-solid)] text-[var(--on-brand-solid-fg)] hover:opacity-90 shadow-lg transition-colors",
    className,
  );
}

export function posCrmPanelClassName(className?: string) {
  return cn(
    "border p-3 rounded-lg relative",
    "bg-[var(--pos-crm-bg)] border-[var(--pos-crm-border)]",
    className,
  );
}

export function posCrmTitleClassName(className?: string) {
  return cn("flex items-center gap-2 font-bold text-[var(--pos-crm-fg)]", className);
}

export function posCrmMutedClassName(className?: string) {
  return cn("text-sm text-[var(--pos-crm-muted)]", className);
}

export function posPromoPanelClassName(className?: string) {
  return cn(
    "border p-3 rounded-lg flex justify-between items-center",
    "bg-[var(--pos-promo-bg)] border-[var(--pos-promo-border)]",
    className,
  );
}

export function posPromoTitleClassName(className?: string) {
  return cn("flex items-center gap-2 font-bold text-[var(--pos-promo-fg)]", className);
}

export function posDashedButtonClassName(className?: string) {
  return cn(
    "w-full border-dashed border-2 bg-[var(--pos-input-bg)] border-[var(--pos-input-border)]",
    "text-muted-foreground hover:text-[var(--pos-price-fg)] hover:border-[var(--pos-accent-hover-border)]",
    className,
  );
}

export function posInputClassName(className?: string) {
  return cn(
    "bg-[var(--pos-input-bg)] border-[var(--pos-input-border)]",
    "focus-visible:ring-[var(--focus-ring)]/50",
    className,
  );
}

export function posRemoveItemClassName(className?: string) {
  return cn(
    "text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)]",
    className,
  );
}

export function posEmptyProductsClassName(className?: string) {
  return cn(
    "col-span-3 text-center py-10 rounded-xl border border-dashed",
    "text-muted-foreground bg-[var(--pos-panel-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posSuccessDialogClassName(className?: string) {
  return cn("bg-[var(--surface-inset)]", className);
}

export function posSuccessTitleClassName(className?: string) {
  return cn(
    "text-center text-2xl font-bold flex flex-col items-center gap-2 text-[var(--brand-text)]",
    className,
  );
}

export function posReceiptPreviewClassName(className?: string) {
  return cn(
    "border p-4 shadow-sm text-sm text-center w-full max-w-[250px] rounded",
    "bg-[var(--pos-panel-bg)] border-[var(--pos-panel-border)] text-[var(--pos-summary-fg)]",
    className,
  );
}

export function posQueueNumberClassName(className?: string) {
  return cn("text-4xl font-black tabular-nums mb-2 text-[var(--brand-text)]", className);
}

export function posModifierSelectedClassName(className?: string) {
  return cn("bg-[var(--brand-solid)] hover:opacity-90 font-bold text-[var(--on-brand-solid-fg)]", className);
}

export function posSettlementIconClassName(className?: string) {
  return cn("text-[var(--pos-settlement-icon)]", className);
}

export function posSettlementHighlightClassName(className?: string) {
  return cn("text-[var(--pos-settlement-highlight)] tabular-nums", className);
}

export function posExpenseIconClassName(className?: string) {
  return cn("text-[var(--pos-expense-icon)]", className);
}

export function posNativeInputClassName(className?: string) {
  return cn(
    "w-full rounded-xl px-4 outline-none transition-colors tabular-nums",
    "bg-[var(--pos-input-bg)] border border-[var(--pos-input-border)]",
    "focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)]",
    className,
  );
}

export function posSettlementSummaryClassName(className?: string) {
  return cn(
    "p-4 rounded-xl border space-y-2",
    "bg-[var(--pos-panel-muted-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posNumpadShellClassName(className?: string) {
  return cn(
    "p-4 rounded-2xl shadow-xl w-full max-w-[320px] mx-auto border",
    "bg-[var(--pos-numpad-bg)] border-[var(--pos-panel-border)]",
    className,
  );
}

export function posNumpadDisplayClassName(className?: string) {
  return cn(
    "border rounded-xl h-14 mb-4 flex items-center justify-center text-2xl font-mono tracking-widest shadow-inner",
    "bg-[var(--pos-numpad-display-bg)] border-[var(--pos-panel-border)] text-[var(--pos-summary-fg)]",
    className,
  );
}

export function posNumpadKeyClassName(className?: string) {
  return cn(
    "h-16 text-2xl font-bold shadow-sm border",
    "bg-[var(--pos-numpad-key-bg)] border-[var(--pos-panel-border)]",
    "hover:bg-[var(--pos-numpad-key-hover)] hover:text-[var(--pos-price-fg)] hover:border-[var(--pos-accent-hover-border)]",
    className,
  );
}

export function posNumpadDeleteClassName(className?: string) {
  return cn(
    posNumpadKeyClassName(),
    "text-[var(--pos-numpad-delete)] hover:bg-[var(--status-danger-bg)]",
    className,
  );
}

export function posNumpadSubmitClassName(className?: string) {
  return cn(
    "h-16 border-none font-bold text-lg shadow-sm",
    "bg-[var(--brand-solid)] hover:opacity-90 text-[var(--on-brand-solid-fg)]",
    className,
  );
}

export function posQueueHighlightClassName(className?: string) {
  return cn("font-mono font-bold text-[var(--brand)]", className);
}

export function kdsConnectedBadgeClassName(className?: string) {
  return cn(
    "flex items-center gap-2 font-mono text-sm font-bold px-3 py-1.5 rounded-full",
    statusToneClassName("success"),
    className,
  );
}

export function kdsDisconnectedBadgeClassName(className?: string) {
  return cn(
    "flex items-center gap-2 font-mono text-sm font-bold px-3 py-1.5 rounded-full",
    statusToneClassName("danger"),
    className,
  );
}

export function kdsConnectedDotClassName() {
  return "w-2 h-2 rounded-full bg-[var(--kds-connected-dot)] animate-pulse motion-reduce:animate-none";
}

export function kdsErrorBannerClassName(className?: string) {
  return dashboardErrorPanelClass(cn("flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4", className));
}

export function kdsErrorRetryClassName(className?: string) {
  return cn(
    "border-[var(--widget-error-border)] text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] shrink-0",
    className,
  );
}

export function kdsLoadingClassName(className?: string) {
  return cn("text-[var(--kds-loading)]", className);
}

export function kdsEmptyStateClassName(className?: string) {
  return cn(
    "w-full py-20 text-center rounded-2xl border border-dashed",
    "border-[var(--kds-ticket-divider)] bg-[var(--kds-ticket-bg)]",
    className,
  );
}

export function kdsTicketGridClassName(className?: string) {
  return cn(
    "grid gap-4 auto-rows-min",
    "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]",
    className,
  );
}

export function kdsTicketClassName(urgency: KdsTicketUrgency, className?: string) {
  return cn(
    "w-full min-h-[420px] max-h-[min(85vh,720px)] lg:min-h-[min(70vh,520px)] rounded-2xl shadow-xl border-4 overflow-hidden flex flex-col",
    "bg-[var(--kds-ticket-bg)] transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
    kdsTicketBorder[urgency],
    className,
  );
}

export function kdsTicketHeaderClassName(urgency: KdsTicketUrgency, className?: string) {
  return cn(
    "p-5 flex justify-between items-center text-[var(--on-kds-header-fg)]",
    kdsTicketHeader[urgency],
    className,
  );
}

export function kdsTicketFooterClassName(className?: string) {
  return cn(
    "p-5 border-t flex gap-3",
    "bg-[var(--kds-ticket-footer-bg)] border-[var(--kds-ticket-divider)]",
    className,
  );
}

export function kdsItemDividerClassName(className?: string) {
  return cn("border-b pb-3 border-[var(--kds-ticket-divider)]", className);
}

export function kdsItemQtyClassName(className?: string) {
  return cn("font-black text-2xl text-[var(--kds-item-qty)]", className);
}

export function kdsItemNoteClassName(className?: string) {
  return cn(
    "mt-2 text-xl font-bold px-2 py-1 rounded inline-block",
    "bg-[var(--kds-note-bg)] text-[var(--kds-note-fg)]",
    className,
  );
}

export function kdsItemModifierClassName(className?: string) {
  return cn(
    "mt-1 text-base font-semibold px-2 py-0.5 rounded inline-block",
    "bg-[var(--kds-modifier-bg)] text-[var(--kds-modifier-fg)]",
    className,
  );
}

export function kdsTimerChipClassName(className?: string) {
  return cn(
    "flex items-center gap-2 font-mono text-lg sm:text-xl font-bold px-3 py-2 rounded-lg shadow-inner",
    "bg-[var(--kds-timer-chip-bg)] text-[var(--on-kds-header-fg)]",
    className,
  );
}

export function kdsImmersiveHeaderClassName(className?: string) {
  return cn(
    "shrink-0 space-y-1 pb-3 border-b mb-4",
    "border-[var(--kds-ticket-divider)]",
    className,
  );
}

export function kdsStartButtonClassName(className?: string) {
  return cn(
    "flex-1 text-[var(--on-kds-start-fg)] font-black text-xl sm:text-2xl min-h-[4.5rem] sm:h-24 shadow-lg",
    "bg-[var(--kds-start-btn)] hover:opacity-90",
    "active:scale-95 motion-reduce:active:scale-100 transition-transform motion-reduce:transition-none",
    className,
  );
}

export function kdsDoneButtonClassName(className?: string) {
  return cn(
    "flex-1 text-[var(--on-kds-done-fg)] font-black text-xl sm:text-2xl min-h-[4.5rem] sm:h-24 shadow-lg",
    "bg-[var(--kds-done-btn)] hover:opacity-90",
    "active:scale-95 motion-reduce:active:scale-100 transition-transform motion-reduce:transition-none",
    className,
  );
}

export function posLoadingSpinnerClassName(className?: string) {
  return kdsLoadingClassName(className);
}

export function posDialogContentClassName(className?: string) {
  return cn(
    "bg-[var(--pos-panel-bg)] border-[var(--pos-panel-border)] text-[var(--foreground)]",
    className,
  );
}

export function posCategoryChipClassName(isActive: boolean, className?: string) {
  return cn(
    "min-h-[44px] rounded-md px-3 text-sm font-semibold border transition-colors",
    isActive
      ? "bg-[var(--pos-category-active-bg)] text-[var(--pos-category-active-fg)] border-transparent"
      : "bg-[var(--pos-category-inactive-bg)] text-[var(--pos-category-inactive-fg)] border-[var(--pos-category-inactive-border)] hover:border-[var(--pos-accent-hover-border)]",
    className,
  );
}

export function posCartEmptyIconClassName(className?: string) {
  return cn("opacity-40 dark:opacity-50", className);
}

export function posImmersiveHeaderClassName(className?: string) {
  return cn(
    "shrink-0 space-y-1 pb-3 border-b mb-4",
    "border-[var(--pos-panel-border)]",
    className,
  );
}

export { text };
