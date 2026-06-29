"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, ChevronDown, PanelLeftClose } from "lucide-react";
import { BranchPicker } from "@/components/shared/branch-picker";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import { useAuth } from "@/context/AuthContext";
import { useBranchPickerInit } from "@/hooks/useBranchPickerInit";
import { useSidebarExpandedGroups } from "@/hooks/useSidebarExpandedGroups";
import { useSidebarNavBadges } from "@/hooks/useSidebarNavBadges";
import { SIDEBAR_GROUPS } from "@/lib/navigation";
import { sidebarBrandLinkClassName, sidebarBrandTitleClassName, sidebarBrandMarkClassName, sidebarBrandMarkIconClassName, sidebarGroupButtonClassName, sidebarIconButtonClassName, sidebarRootClassName, shell, shellHeaderInsetClassName } from "@/lib/theme/shell";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

function toGroupId(groupName: string) {
  return groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

type SidebarProps = {
  onNavigate?: () => void;
  onCollapse?: () => void;
  className?: string;
};

export function Sidebar({ onNavigate, onCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user?.role ?? "STAFF") as Role;
  const { expandedGroups, toggleGroup } = useSidebarExpandedGroups(user?.role as Role | undefined);
  const { isSuperAdmin, branches, activeBranchId, setActiveBranchId } = useBranchPickerInit();
  const { badges, childTabBadges } = useSidebarNavBadges();

  return (
    <div className={sidebarRootClassName(className)}>
      <div className={cn("shrink-0 border-b", shell.sidebarDivider, shellHeaderInsetClassName())}>
        <div className="h-14 md:h-16 flex items-center gap-2 px-4">
          <Link
            href="/"
            onClick={onNavigate}
            className={sidebarBrandLinkClassName()}
            aria-label="BranchBrew home"
          >
            <div className={sidebarBrandMarkClassName()} aria-hidden>
              <Coffee className={sidebarBrandMarkIconClassName()} />
            </div>
            <span className={cn(sidebarBrandTitleClassName(), "min-w-0 truncate")}>BranchBrew</span>
          </Link>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(sidebarIconButtonClassName(), "ml-2")}
              aria-label="Collapse sidebar to icon rail"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>

        {isSuperAdmin && branches.length > 0 && (
          <div className="px-4 pb-4">
            <BranchPicker
              variant="sidebar"
              branches={branches}
              activeBranchId={activeBranchId}
              onChange={setActiveBranchId}
            />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar" aria-label="Primary navigation">
        {SIDEBAR_GROUPS.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups[group.group];
          const groupId = toGroupId(group.group);

          return (
            <div key={group.group} className={cn(groupIdx > 0 && "mt-4")}>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`sidebar-group-${groupId}`}
                onClick={() => toggleGroup(group.group)}
                className={sidebarGroupButtonClassName()}
              >
                {group.group}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 motion-reduce:transition-none motion-reduce:transform-none",
                    !isExpanded && "-rotate-90",
                  )}
                  aria-hidden
                />
              </button>

              {isExpanded && (
                <div id={`sidebar-group-${groupId}`} className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      role={role}
                      onNavigate={onNavigate}
                      badges={badges}
                      childTabBadges={childTabBadges}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
