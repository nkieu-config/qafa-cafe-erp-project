import { cn } from "@/lib/utils";
import { text } from "./surface";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/50 motion-reduce:transition-none";

export const shell = {
  bg: "bg-[var(--shell-bg)]",
  sidebarBorder: "border-[var(--sidebar-border)]",
  sidebarDivider: "border-[var(--sidebar-divider)]",
  maxWidth: "max-w-[1600px]",
} as const;

/** Align topbar + page content to the same centered column. */
export function shellContentFrameClassName(className?: string) {
  return cn(shell.maxWidth, "mx-auto w-full px-4 md:px-6 lg:px-8", className);
}

export function shellContentPaddingYClassName(className?: string) {
  return cn("py-4 md:py-6 lg:py-8", className);
}

export function shellPageTitleClassName(className?: string) {
  return cn(
    "text-xl sm:text-2xl font-bold text-balance flex items-center gap-2 min-w-0",
    text.primary,
    className,
  );
}

/** Shared top inset for sidebar brand row + main topbar (safe area + breathing room). */
export function shellHeaderInsetClassName(className?: string) {
  return cn(
    "pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(1rem+env(safe-area-inset-top,0px))]",
    className,
  );
}

/** Full-width topbar region — inset from viewport top, subtle surface, bottom rule. */
export function topbarRegionClassName(className?: string) {
  return cn(
    "relative z-30 shrink-0 w-full overflow-visible border-b",
    "border-[var(--border)]/50 bg-[var(--topbar-bg)] backdrop-blur-md",
    shellHeaderInsetClassName(),
    className,
  );
}

/** Inner topbar row — stable height across all routes (no compact/immersive jump). */
export function topbarShellClassName(_options: { compactDesktop?: boolean } = {}, className?: string) {
  return cn(
    "flex w-full items-center gap-3 z-20 relative",
    "min-h-14 pb-3 md:pb-4",
    className,
  );
}

/** Right-side topbar actions row — separated controls, no enclosing pill. */
export function topbarActionsRowClassName(className?: string) {
  return cn("flex items-center gap-2 shrink-0", className);
}

/** Subtle divider between work actions and account/shell controls. */
export function topbarActionsDividerClassName(className?: string) {
  return cn(
    "hidden sm:block w-px h-6 shrink-0 bg-[var(--border)]/70 mx-0.5",
    className,
  );
}

/** Standalone topbar icon control (not nested in a group pill). */
export function topbarActionButtonClassName(
  options: { active?: boolean; className?: string } = {},
) {
  return cn(
    topbarIconButtonClassName(options),
    "border-[var(--topbar-picker-border)]/60 bg-[var(--topbar-picker-bg)] shadow-sm",
    options.className,
  );
}

/** @deprecated Prefer topbarActionsRowClassName — grouped pill obscures distinct control types. */
export function topbarActionGroupClassName(className?: string) {
  return topbarActionsRowClassName(className);
}

/** Fixed-width slot for clock control — prevents toolbar width jump between states. */
export function topbarClockSlotClassName(className?: string) {
  return cn("inline-flex items-center justify-center shrink-0 min-w-9", className);
}

/** 44×44 icon control — matches sidebar touch targets. */
export function topbarIconButtonClassName(
  options: { active?: boolean; className?: string } = {},
) {
  return cn(
    "inline-flex items-center justify-center",
    "h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-transparent",
    "text-[var(--topbar-action-fg)] transition-colors",
    "hover:bg-[var(--topbar-action-hover)] hover:text-[var(--foreground)]",
    focusRing,
    options.active &&
      "bg-[var(--topbar-action-active-bg)] text-[var(--topbar-action-active-fg)] border-[var(--sidebar-nav-active-border)]",
    options.className,
  );
}

/** Mobile menu trigger — same visual language as action group items. */
export function topbarMenuButtonClassName(className?: string) {
  return cn(
    topbarIconButtonClassName(),
    "border-[var(--topbar-picker-border)] bg-[var(--topbar-picker-bg)] shadow-sm lg:hidden",
    className,
  );
}

/** Primary action inside toolbar (e.g. Clock In). */
export function topbarPrimaryActionClassName(className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg border border-transparent",
    "h-11 min-h-[44px] px-3 text-sm font-semibold shadow-sm transition-colors",
    "bg-[var(--brand-solid)] text-[var(--on-brand-solid-fg)]",
    "hover:opacity-90",
    focusRing,
    className,
  );
}

/** Profile trigger — icon-only, same size/radius as clock/theme. */
export function topbarProfileButtonClassName(className?: string) {
  return cn(topbarActionButtonClassName(), className);
}

export function topbarDesktopBreadcrumbClassName(className?: string) {
  return cn(
    breadcrumbNavClassName(),
    "hidden lg:flex min-w-0 text-xs font-medium",
    className,
  );
}

export function sidebarRootClassName(className?: string, collapsed?: boolean) {
  return cn(
    collapsed ? "w-16" : "w-64",
    "border-r h-screen flex flex-col z-40 relative transition-[width] duration-200 motion-reduce:transition-none",
    "bg-[var(--sidebar-panel-bg)] shadow-[var(--shadow-sm)]",
    shell.sidebarBorder,
    className,
  );
}

export function sidebarRailLinkClassName(isActive: boolean, isCurrentPage: boolean, className?: string) {
  return cn(
    "relative flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl transition-colors border",
    focusRing,
    isActive
      ? "bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-fg)] border-[var(--sidebar-nav-active-border)]"
      : "text-[var(--sidebar-nav-inactive-fg)] border-transparent hover:bg-[var(--sidebar-nav-inactive-hover-bg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)]",
    isCurrentPage &&
      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-[var(--sidebar-nav-active-indicator)]",
    className,
  );
}

export function sidebarRailExpandButtonClassName(className?: string) {
  return cn(
    "flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl transition-colors border border-transparent",
    "text-[var(--sidebar-nav-inactive-fg)] hover:bg-[var(--sidebar-nav-inactive-hover-bg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)]",
    focusRing,
    className,
  );
}

export function mobileBottomNavClassName(className?: string) {
  return cn(
    "fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t",
    "bg-[var(--mobile-nav-bg)] border-[var(--mobile-nav-border)] shadow-[var(--shadow-lg)]",
    "pb-[env(safe-area-inset-bottom,0px)] lg:hidden",
    className,
  );
}

export function mobileBottomNavItemClassName(isActive: boolean, className?: string) {
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-2 text-xs font-semibold transition-colors",
    focusRing,
    isActive
      ? "text-[var(--sidebar-nav-active-fg)]"
      : "text-[var(--sidebar-nav-inactive-fg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)]",
    className,
  );
}

export function mobileBottomNavIconClassName(isActive: boolean) {
  return cn(
    "w-5 h-5 shrink-0",
    isActive ? "text-[var(--sidebar-nav-active-icon)]" : "text-[var(--sidebar-nav-icon)]",
  );
}

export function mobileNavBadgePlacementClassName(className?: string) {
  return cn(
    "top-0 right-0 translate-x-1/3 -translate-y-1/3 ring-[var(--mobile-nav-bg)]",
    className,
  );
}

export function mainContentWithMobileNavClassName(className?: string) {
  return cn("pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0", className);
}

/** Bottom padding when POS immersive tab bar replaces global mobile nav. */
export function mainContentWithPosImmersiveNavClassName(className?: string) {
  return cn("pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0", className);
}

export function sidebarPinnedLabelClassName(className?: string) {
  return cn(
    "px-3 py-2 mb-1 text-[11px] font-medium uppercase tracking-widest",
    "text-[var(--sidebar-group-label)]",
    className,
  );
}

/** Tree ul indent — keep in sync with child link active-indicator offset. */
export const sidebarTreeIndentClassName =
  "ml-3 border-l border-[var(--sidebar-tree-border)] pl-2";

const sidebarTreeChildIndicatorClassName =
  "before:absolute before:-left-[calc(0.5rem+1px)] before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[3px] before:rounded-full before:bg-[var(--sidebar-nav-active-indicator)]";

export function sidebarIconButtonClassName(className?: string) {
  return cn(
    "flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-colors",
    "text-[var(--sidebar-nav-inactive-fg)] hover:bg-[var(--sidebar-nav-inactive-hover-bg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)]",
    focusRing,
    className,
  );
}

export function sidebarPinButtonClassName(isPinned: boolean, className?: string) {
  return cn(
    sidebarIconButtonClassName(),
    "text-[var(--sidebar-nav-icon)]",
    !isPinned && "md:opacity-40 md:group-hover/navitem:opacity-100 md:focus-visible:opacity-100",
    isPinned && "text-[var(--sidebar-nav-active-icon)]",
    className,
  );
}

export function sidebarNavBadgeClassName(tone: "warning" | "danger" | "info" = "warning", className?: string) {
  const toneClass =
    tone === "danger"
      ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]"
      : tone === "info"
        ? "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]"
        : "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]";

  return cn(
    "ml-auto inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full px-1.5",
    "text-xs font-bold tabular-nums leading-none shrink-0",
    toneClass,
    className,
  );
}

export function sidebarRailBadgeDotClassName(tone: "warning" | "danger" | "info" = "warning", className?: string) {
  const toneClass =
    tone === "danger"
      ? "bg-[var(--status-danger-fg)]"
      : tone === "info"
        ? "bg-[var(--status-info-fg)]"
        : "bg-[var(--status-warning-fg)]";

  return cn(
    "absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-[var(--sidebar-panel-bg)]",
    toneClass,
    className,
  );
}

export function sidebarBrandTitleClassName() {
  return cn(
    "font-extrabold text-xl tracking-tight bg-clip-text text-transparent",
    "bg-gradient-to-br from-[var(--sidebar-brand-gradient-from)] to-[var(--sidebar-brand-gradient-to)]",
  );
}

export function sidebarBrandLinkClassName(className?: string) {
  return cn(
    "flex items-center min-w-0 flex-1 gap-3 rounded-lg transition-opacity hover:opacity-90",
    focusRing,
    className,
  );
}

export function sidebarBrandMarkClassName(className?: string) {
  return cn(
    "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
    "bg-[var(--sidebar-brand-mark-bg)]",
    className,
  );
}

export function sidebarBrandMarkIconClassName(className?: string) {
  return cn("w-5 h-5 text-[var(--sidebar-brand-mark-fg)]", className);
}

export function sidebarGroupButtonClassName(className?: string) {
  return cn(
    "w-full flex items-center justify-between px-3 py-2 min-h-[44px] mb-1",
    "text-[11px] font-medium uppercase tracking-widest rounded-lg transition-colors",
    "text-[var(--sidebar-group-label)] hover:text-[var(--sidebar-group-label-hover)]",
    "hover:bg-[var(--sidebar-nav-inactive-hover-bg)]",
    focusRing,
    className,
  );
}

export function sidebarNavLinkClassName(
  isActive: boolean,
  isCurrentPage = isActive,
  className?: string,
) {
  return cn(
    "relative flex items-center px-3 py-2.5 min-h-[44px] rounded-xl transition-colors duration-200 font-semibold text-sm border",
    focusRing,
    isActive
      ? "bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-fg)] border-[var(--sidebar-nav-active-border)] shadow-sm"
      : "text-[var(--sidebar-nav-inactive-fg)] border-transparent hover:bg-[var(--sidebar-nav-inactive-hover-bg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)] interactive-item",
    isCurrentPage &&
      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-[var(--sidebar-nav-active-indicator)]",
    className,
  );
}

export function sidebarNavChildLinkClassName(isActive: boolean, className?: string) {
  return cn(
    "relative flex items-center gap-2 px-2.5 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors",
    focusRing,
    isActive
      ? "bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-fg)] font-semibold"
      : "text-[var(--sidebar-nav-inactive-fg)] hover:bg-[var(--sidebar-nav-inactive-hover-bg)] hover:text-[var(--sidebar-nav-inactive-hover-fg)]",
    isActive && sidebarTreeChildIndicatorClassName,
    className,
  );
}

/** Branch scope pill shown in the sidebar header (SUPER_ADMIN). */
export function sidebarBranchPillClassName(className?: string) {
  return cn(
    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 min-h-[36px] w-full border",
    "bg-[var(--topbar-picker-bg)] border-[var(--topbar-picker-border)] shadow-sm",
    className,
  );
}

/** Compact clock-in/out control in the top bar (standalone pill — prefer toolbar variant). */
export function topbarClockWidgetClassName(className?: string) {
  return cn(
    "flex items-center gap-1.5 rounded-lg border px-1.5 py-0.5 min-h-[36px]",
    "bg-[var(--topbar-picker-bg)] border-[var(--topbar-picker-border)]",
    className,
  );
}

export function sidebarNavIconClassName(isActive: boolean) {
  return cn(
    "w-4 h-4 mr-3 transition-colors shrink-0",
    isActive ? "text-[var(--sidebar-nav-active-icon)]" : "text-[var(--sidebar-nav-icon)]",
  );
}

export function sidebarLogoutButtonClassName(className?: string) {
  return cn(
    "w-full justify-start min-h-[44px] rounded-xl interactive-item transition-colors",
    "text-[var(--status-danger-fg)] hover:text-[var(--status-danger-fg)]",
    "hover:bg-[var(--status-danger-bg)]",
    "border-[var(--sidebar-logout-border)] bg-[var(--sidebar-logout-bg)]",
    className,
  );
}

export function topbarBranchPickerClassName(className?: string) {
  return cn(
    "flex items-center gap-2 rounded-xl px-2 py-1 shadow-sm min-h-[44px] border",
    "bg-[var(--topbar-picker-bg)] border-[var(--topbar-picker-border)]",
    className,
  );
}

export function topbarBranchIconClassName() {
  return "w-4 h-4 shrink-0 text-[var(--topbar-picker-icon)]";
}

export function breadcrumbNavClassName(className?: string) {
  return cn(
    "flex items-center min-w-0 text-sm font-medium overflow-x-auto",
    "text-[var(--breadcrumb-fg)]",
    className,
  );
}

export function breadcrumbLinkClassName(className?: string) {
  return cn(
    "shrink-0 transition-colors rounded-sm",
    "hover:text-[var(--breadcrumb-link-hover)]",
    focusRing,
    className,
  );
}

export function breadcrumbSeparatorClassName() {
  return "mx-2 shrink-0 text-[var(--breadcrumb-separator)]";
}

export function breadcrumbCurrentClassName(className?: string) {
  return cn("font-bold tracking-tight truncate text-[var(--breadcrumb-current)]", className);
}

export function breadcrumbParentClassName(className?: string) {
  return cn("shrink-0 text-[var(--breadcrumb-parent)]", className);
}

export function profileMenuHeaderDividerClassName(className?: string) {
  return cn("px-3 py-2 border-b mb-1 border-[var(--profile-menu-divider)]", className);
}

export function profileMenuPanelClassName(className?: string) {
  return cn(
    "z-[100] w-56 rounded-xl border p-2 shadow-lg",
    "bg-[var(--profile-menu-bg)] border-[var(--profile-menu-border)]",
    className,
  );
}

export function profileAvatarButtonClassName(className?: string) {
  return cn(
    topbarProfileButtonClassName(),
    className,
  );
}

export function profileAvatarInitialClassName(className?: string) {
  return cn(
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
    "font-bold text-xs bg-[var(--surface-inset)] text-[var(--profile-avatar-fg)]",
    className,
  );
}

export function destructiveMenuItemClassName(className?: string) {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium",
    "text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger-fg)]/40",
    className,
  );
}

export function skipLinkClassName() {
  return cn(
    "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
    "focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none",
    "focus:bg-[var(--skip-link-bg)] focus:text-[var(--skip-link-fg)]",
  );
}

export function selectFocusClassName(className?: string) {
  return cn("focus-visible:ring-[var(--focus-ring)]/50", className);
}
