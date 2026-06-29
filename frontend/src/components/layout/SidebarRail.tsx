"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, PanelLeftOpen } from "lucide-react";
import { SidebarNavBadge } from "@/components/shared/sidebar-nav-badge";
import { useAuth } from "@/context/AuthContext";
import { useSidebarNavBadges } from "@/hooks/useSidebarNavBadges";
import { FLAT_SIDEBAR_ITEMS, findActiveSidebarItem, isSidebarItemActive } from "@/lib/navigation";
import { sidebarRailExpandButtonClassName, sidebarRailLinkClassName, sidebarBrandMarkClassName, sidebarBrandMarkIconClassName, sidebarRootClassName, shell, shellHeaderInsetClassName } from "@/lib/theme/shell";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

type SidebarRailProps = {
  onExpand?: () => void;
  onNavigate?: () => void;
  className?: string;
};

export function SidebarRail({ onExpand, onNavigate, className }: SidebarRailProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user?.role ?? "STAFF") as Role;
  const { badges } = useSidebarNavBadges();

  const visibleItems = FLAT_SIDEBAR_ITEMS.filter((item) => item.roles.includes(role));
  const activeItem = findActiveSidebarItem(pathname);

  return (
    <div className={sidebarRootClassName(className, true)}>
      <div className={cn("h-14 md:h-16 flex items-center justify-center border-b shrink-0", shell.sidebarDivider, shellHeaderInsetClassName())}>
        <Link
          href="/"
          onClick={onNavigate}
          className={sidebarBrandMarkClassName()}
          aria-label="BranchBrew home"
        >
          <Coffee className={sidebarBrandMarkIconClassName()} aria-hidden />
        </Link>
      </div>

      <nav
        className="flex-1 p-2 overflow-y-auto custom-scrollbar flex flex-col items-center gap-1"
        aria-label="Primary navigation"
      >
        {visibleItems.map((item) => {
          const isActive = isSidebarItemActive(item, pathname);
          const isCurrentPage = activeItem?.id === item.id;
          const ItemIcon = item.icon;
          const badge = badges[item.id];

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              aria-label={badge ? `${item.label}, ${badge.label}` : item.label}
              aria-current={isCurrentPage ? "page" : undefined}
              className={cn(sidebarRailLinkClassName(isActive, isCurrentPage), "relative")}
            >
              <ItemIcon className="w-5 h-5 shrink-0" aria-hidden />
              {badge && (
                <SidebarNavBadge
                  count={badge.count}
                  tone={badge.tone}
                  label={badge.label}
                  variant="dot"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {onExpand && (
        <div className={cn("p-2 border-t shrink-0 flex justify-center", shell.sidebarDivider)}>
          <button
            type="button"
            onClick={onExpand}
            className={sidebarRailExpandButtonClassName()}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
