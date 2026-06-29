"use client";

import Link from "next/link";
import { SidebarNavBadge } from "@/components/shared/sidebar-nav-badge";
import {
  getHubConfig,
  getVisibleHubTabs,
  isSidebarItemActive,
  isTabActive,
  resolveSidebarHubId,
  shouldShowHubSubNav,
  type SidebarItem,
} from "@/lib/navigation";
import { resolveChildTabHref, resolveSidebarItemHref } from "@/lib/operational-links";
import type { SidebarNavBadgeMap } from "@/lib/sidebar-badges";
import { sidebarNavChildLinkClassName, sidebarNavIconClassName, sidebarNavLinkClassName, sidebarTreeIndentClassName } from "@/lib/theme/shell";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

type SidebarNavItemProps = {
  item: SidebarItem;
  pathname: string;
  role: Role;
  onNavigate?: () => void;
  badges?: SidebarNavBadgeMap;
  childTabBadges?: SidebarNavBadgeMap;
};

export function SidebarNavItem({
  item,
  pathname,
  role,
  onNavigate,
  badges,
  childTabBadges,
}: SidebarNavItemProps) {
  const ItemIcon = item.icon;
  const hubId = resolveSidebarHubId(item.id);
  const hub = hubId ? getHubConfig(hubId) : null;
  const childTabs = hubId ? getVisibleHubTabs(hubId, role) : [];
  const isHubActive = isSidebarItemActive(item, pathname);
  const showTree =
    hub != null && isHubActive && shouldShowHubSubNav(childTabs, hub.basePath);
  const badge = badges?.[item.id];
  const parentHref = resolveSidebarItemHref(
    item.id,
    item.href,
    badges,
    childTabBadges,
  );

  const activeChildTab = hub
    ? childTabs.find((tab) => isTabActive(pathname, tab.path, hub.basePath))
    : undefined;
  const isParentCurrentPage =
    isHubActive && (!activeChildTab || activeChildTab.path === item.href);

  return (
    <div className="space-y-0.5">
      <Link
        href={parentHref}
        onClick={onNavigate}
        aria-current={isParentCurrentPage ? "page" : undefined}
        className={sidebarNavLinkClassName(isHubActive, isParentCurrentPage)}
      >
        <ItemIcon className={sidebarNavIconClassName(isHubActive)} aria-hidden />
        <span className="truncate">{item.label}</span>
        {badge && (
          <SidebarNavBadge count={badge.count} tone={badge.tone} label={badge.label} />
        )}
      </Link>

      {showTree && (
        <ul
          className={cn(sidebarTreeIndentClassName, "space-y-0.5")}
          role="group"
          aria-label={`${item.label} sections`}
        >
          {childTabs.map((tab) => {
            const isChildActive = isTabActive(pathname, tab.path, hub.basePath);
            const tabBadge = childTabBadges?.[tab.path];
            return (
              <li key={tab.path}>
                <Link
                  href={resolveChildTabHref(tab.path, childTabBadges)}
                  onClick={onNavigate}
                  aria-current={isChildActive ? "page" : undefined}
                  aria-label={tabBadge ? `${tab.label}, ${tabBadge.label}` : tab.label}
                  className={cn(sidebarNavChildLinkClassName(isChildActive), "justify-between gap-2")}
                >
                  <span className="truncate">{tab.label}</span>
                  {tabBadge && (
                    <SidebarNavBadge
                      count={tabBadge.count}
                      tone={tabBadge.tone}
                      label={tabBadge.label}
                      className="ml-0 shrink-0"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
