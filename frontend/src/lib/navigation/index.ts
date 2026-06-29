export type {
  NavRole,
  SidebarItem,
  SidebarGroup,
  HubTab,
  HubId,
  HubConfig,
  MobileBottomNavItem,
  BreadcrumbItem,
} from "./types";

export { PATH_LABELS } from "./path-labels";

export { HUBS } from "./hubs";
export {
  inventoryHub,
  procurementHub,
  hrHub,
  productsHub,
  kitchenHub,
  crmHub,
  financeHub,
  assetsHub,
  posHub,
  settingsHub,
  organizationHub,
} from "./hubs";

export {
  SIDEBAR_GROUPS,
  FLAT_SIDEBAR_ITEMS,
  resolveSidebarHubId,
  findActiveSidebarItem,
  isSidebarItemActive,
} from "./sidebar";

export {
  MOBILE_BOTTOM_NAV_ITEMS,
  getMobileBottomNavItems,
  isMobileBottomNavActive,
  isMobileBottomNavPathCovered,
  shouldShowMobileBreadcrumb,
  getMobileBottomNavBadgeId,
} from "./mobile-nav";

export {
  getHubConfig,
  getVisibleHubTabs,
  isTabActive,
  shouldShowHubSubNav,
  findHubByPathname,
  resolveActiveHubTab,
  resolveHubShellTitle,
  isRedundantPageTitle,
} from "./hub-utils";

export {
  resolvePathLabel,
  resolveBreadcrumb,
  resolveBreadcrumbTrail,
} from "./breadcrumb";
