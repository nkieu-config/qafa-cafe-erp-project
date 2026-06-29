import { HUBS } from "./hubs";
import type { HubConfig, HubId, HubTab, NavRole } from "./types";

export function getHubConfig(hubId: HubId): HubConfig {
  return HUBS[hubId];
}

export function getVisibleHubTabs(hubId: HubId, role: string): HubTab[] {
  const hub = HUBS[hubId];
  const navRole = role as NavRole;
  return hub.tabs
    .filter((tab) => tab.roles.includes(navRole))
    .sort((a, b) => {
      const orderA = a.order?.[navRole] ?? 50;
      const orderB = b.order?.[navRole] ?? 50;
      return orderA - orderB;
    });
}

export function isTabActive(pathname: string, tabPath: string, basePath: string): boolean {
  if (tabPath === basePath) {
    return pathname === basePath;
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

/** Hide sidebar/hub sub-nav when a hub has a single root-level tab. */
export function shouldShowHubSubNav(tabs: HubTab[], basePath: string): boolean {
  if (tabs.length === 0) return false;
  return !(tabs.length === 1 && tabs[0].path === basePath);
}

export function findHubByPathname(pathname: string): HubConfig | undefined {
  return Object.values(HUBS)
    .sort((a, b) => b.basePath.length - a.basePath.length)
    .find(
      (hub) =>
        pathname === hub.basePath ||
        pathname.startsWith(`${hub.basePath}/`) ||
        hub.tabs.some(
          (tab) =>
            pathname === tab.path ||
            (tab.path !== hub.basePath && pathname.startsWith(`${tab.path}/`)),
        ),
    );
}

function findActiveTabForPathname(pathname: string, hub: HubConfig): HubTab | undefined {
  return [...hub.tabs]
    .sort((a, b) => b.path.length - a.path.length)
    .find((tab) => isTabActive(pathname, tab.path, hub.basePath));
}

/** Active hub tab for the current pathname (exported for HubShell / page chrome). */
export function resolveActiveHubTab(pathname: string, hub: HubConfig): HubTab | undefined {
  return findActiveTabForPathname(pathname, hub);
}

/** Contextual h1 for hub pages — tab label, or hub label on root tab. */
export function resolveHubShellTitle(pathname: string, hub: HubConfig): string {
  const activeTab = findActiveTabForPathname(pathname, hub);
  if (!activeTab) return hub.label;

  const onHubRoot = pathname === hub.basePath && activeTab.path === hub.basePath;
  if (onHubRoot) {
    /** Single-tab hubs (e.g. Assets): prefer the tab label when it differs from hub label. */
    if (hub.tabs.length === 1 && activeTab.label !== hub.label) {
      return activeTab.label;
    }
    /** Multi-tab hubs on root (e.g. Inventory → Overview tab at /inventory). */
    if (activeTab.label !== hub.label) {
      return activeTab.label;
    }
    return hub.label;
  }

  return activeTab.label;
}

/** True when a page-level title duplicates the HubShell h1. */
export function isRedundantPageTitle(
  pageTitle: string,
  pathname: string,
  hub: HubConfig,
): boolean {
  return pageTitle === resolveHubShellTitle(pathname, hub);
}

export { findActiveTabForPathname };
