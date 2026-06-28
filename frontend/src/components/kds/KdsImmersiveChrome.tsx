"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, WifiOff } from "lucide-react";
import { BranchScopeIndicator } from "@/components/shared/branch-scope-indicator";
import { SidebarNavBadge } from "@/components/shared/sidebar-nav-badge";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useSidebarNavBadges } from "@/hooks/useSidebarNavBadges";
import {
  getMobileBottomNavItems,
  isMobileBottomNavActive,
} from "@/lib/navigation";
import { resolveMobileBottomNavBadge } from "@/lib/sidebar-badges";
import {
  kdsConnectedBadgeClassName,
  kdsConnectedDotClassName,
  kdsDisconnectedBadgeClassName,
  kdsImmersiveHeaderClassName,
  mobileBottomNavClassName,
  mobileBottomNavIconClassName,
  mobileBottomNavItemClassName,
  shellPageTitleClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Branch, Role } from "@/types/api";

export type KdsQueueStats = {
  total: number;
  late: number;
  preparing: number;
};

export function KdsConnectionBadge({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <div className={kdsConnectedBadgeClassName()}>
        <div className={kdsConnectedDotClassName()} aria-hidden="true" />
        <span>Live sync</span>
      </div>
    );
  }

  return (
    <div className={kdsDisconnectedBadgeClassName()}>
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Socket disconnected — polling every 30s</span>
      <span className="sm:hidden">Offline · poll 30s</span>
    </div>
  );
}

type KdsImmersiveHeaderProps = {
  isConnected: boolean;
  queueStats: KdsQueueStats;
  isLoading?: boolean;
};

export function KdsImmersiveHeader({
  isConnected,
  queueStats,
  isLoading = false,
}: KdsImmersiveHeaderProps) {
  const { activeBranchId } = useAuth();
  const { data: branches = [] } = useBranches();
  const branchName =
    activeBranchId != null
      ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name
      : undefined;

  return (
    <header className={kdsImmersiveHeaderClassName()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={shellPageTitleClassName()}>Kitchen Display</h1>
            <BranchScopeIndicator
              branchName={branchName}
              allBranches={activeBranchId == null}
            />
          </div>
          <p className={cn("text-sm", text.muted)}>Real-time order queue for this branch.</p>
        </div>
        <KdsConnectionBadge isConnected={isConnected} />
      </div>

      {!isLoading && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-2"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={cn("font-semibold tabular-nums", text.primary)}>
            {queueStats.total} order{queueStats.total === 1 ? "" : "s"} in queue
          </span>
          {queueStats.preparing > 0 && (
            <span className={text.muted}>{queueStats.preparing} preparing</span>
          )}
          {queueStats.late > 0 && (
            <span className="font-medium text-[var(--status-danger-fg)]">
              {queueStats.late} overdue (10+ min)
            </span>
          )}
          {queueStats.total === 0 && (
            <span className={text.muted}>Kitchen is clear</span>
          )}
        </div>
      )}
    </header>
  );
}

export function KdsImmersiveNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggle } = useMobileNav();
  const { badges } = useSidebarNavBadges();
  const role = (user?.role ?? "STAFF") as Role;
  const items = getMobileBottomNavItems(role);

  return (
    <nav aria-label="Quick navigation" className={mobileBottomNavClassName()}>
      {items.map((item) => {
        const isActive = isMobileBottomNavActive(item, pathname);
        const ItemIcon = item.icon;
        const badge = resolveMobileBottomNavBadge(item.id, badges);

        if (item.action === "menu") {
          return (
            <button
              key={item.id}
              type="button"
              onClick={toggle}
              className={cn(
                mobileBottomNavItemClassName(false),
                "relative border-0 bg-transparent cursor-pointer",
              )}
              aria-label={badge ? `Open menu, ${badge.label}` : "Open full navigation menu"}
            >
              <span className="relative inline-flex">
                <ItemIcon className={mobileBottomNavIconClassName(false)} aria-hidden />
                {badge && (
                  <SidebarNavBadge
                    count={badge.count}
                    tone={badge.tone}
                    label={badge.label}
                    variant="dot"
                    className="top-0 right-0 translate-x-1/3 -translate-y-1/3 ring-[var(--mobile-nav-bg)]"
                  />
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={badge ? `${item.label}, ${badge.label}` : item.label}
            className={cn(mobileBottomNavItemClassName(isActive), "relative")}
          >
            <span className="relative inline-flex">
              <ItemIcon className={mobileBottomNavIconClassName(isActive)} aria-hidden />
              {badge && (
                <SidebarNavBadge
                  count={badge.count}
                  tone={badge.tone}
                  label={badge.label}
                  variant="dot"
                  className="top-0 right-0 translate-x-1/3 -translate-y-1/3 ring-[var(--mobile-nav-bg)]"
                />
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
