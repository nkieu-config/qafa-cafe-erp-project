"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BranchScopeIndicator } from "@/components/shared/branch-scope-indicator";
import { ImmersiveBranchToolbar } from "@/components/shared/immersive-branch-toolbar";
import { useAuth } from "@/context/AuthContext";
import { useMobileNav } from "@/context/MobileNavContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { getVisibleHubTabs, isTabActive } from "@/lib/navigation";
import { posImmersiveHeaderClassName } from "@/lib/theme/immersive";
import { mobileBottomNavClassName, mobileBottomNavIconClassName, mobileBottomNavItemClassName, shellPageTitleClassName } from "@/lib/theme/shell";
import { text } from "@/lib/theme/surface";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types/api";

const PAGE_TITLES: Record<string, string> = {
  "/pos/terminal": "Terminal",
  "/pos/settlement": "End of Day Settlement",
};

function resolvePosPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/pos/terminal")) return PAGE_TITLES["/pos/terminal"];
  if (pathname.startsWith("/pos/settlement")) return PAGE_TITLES["/pos/settlement"];
  return "Point of Sale";
}

function resolvePosPageDescription(pathname: string) {
  if (pathname.startsWith("/pos/settlement")) {
    return "Reconcile all payment channels and submit to HQ.";
  }
  return "Process sales for the selected branch.";
}

export function PosImmersiveHeader() {
  const pathname = usePathname();
  const { activeBranchId } = useAuth();
  const { data: branches = [] } = useBranches();
  const branchName =
    activeBranchId != null
      ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name
      : undefined;

  return (
    <header className={posImmersiveHeaderClassName()}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={shellPageTitleClassName()}>{resolvePosPageTitle(pathname)}</h1>
        <BranchScopeIndicator
          branchName={branchName}
          allBranches={activeBranchId == null}
        />
      </div>
      <ImmersiveBranchToolbar className="max-w-md" />
      <p className={cn("text-sm hidden sm:block", text.muted)}>{resolvePosPageDescription(pathname)}</p>
    </header>
  );
}

export function PosImmersiveNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggle } = useMobileNav();
  const role = user?.role ?? "STAFF";
  const tabs = getVisibleHubTabs("pos", role);

  return (
    <nav aria-label="POS navigation" className={mobileBottomNavClassName()}>
      {tabs.map((tab) => {
        const isActive = isTabActive(pathname, tab.path, "/pos");
        const TabIcon = tab.icon;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            aria-current={isActive ? "page" : undefined}
            className={mobileBottomNavItemClassName(isActive)}
          >
            <TabIcon className={mobileBottomNavIconClassName(isActive)} aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          mobileBottomNavItemClassName(false),
          "border-0 bg-transparent cursor-pointer",
        )}
        aria-label="Open full navigation menu"
      >
        <Menu className={mobileBottomNavIconClassName(false)} aria-hidden />
        <span>Menu</span>
      </button>
    </nav>
  );
}
