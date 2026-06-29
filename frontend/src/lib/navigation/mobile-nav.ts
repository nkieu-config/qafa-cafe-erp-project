import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MonitorPlay,
  Receipt,
  Menu,
} from "lucide-react";
import type { MobileBottomNavItem, NavRole } from "./types";

export const MOBILE_BOTTOM_NAV_ITEMS: MobileBottomNavItem[] = [
  {
    id: "pos",
    label: "POS",
    href: "/pos/terminal",
    icon: ShoppingCart,
    roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
  },
  {
    id: "kds",
    label: "KDS",
    href: "/kds",
    icon: MonitorPlay,
    roles: ["STAFF"],
  },
  {
    id: "orders",
    label: "Orders",
    href: "/pos/orders",
    icon: Receipt,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    id: "inventory",
    label: "Stock",
    href: "/inventory",
    icon: Package,
    roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
  },
  {
    id: "dashboard",
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    id: "more",
    label: "More",
    href: "#menu",
    icon: Menu,
    roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
    action: "menu",
  },
];

export function getMobileBottomNavItems(role: string): MobileBottomNavItem[] {
  const navRole = role as NavRole;
  const visible = MOBILE_BOTTOM_NAV_ITEMS.filter((item) => item.roles.includes(navRole));
  const more = visible.find((item) => item.action === "menu");
  const links = visible.filter((item) => item.action !== "menu");
  if (!more) return links.slice(0, 4);
  return [...links.slice(0, 3), more];
}

export function isMobileBottomNavActive(item: MobileBottomNavItem, pathname: string): boolean {
  if (item.action === "menu") return false;
  if (item.href === "/") return pathname === "/";
  if (item.id === "pos") {
    return pathname.startsWith("/pos") && !pathname.startsWith("/pos/orders");
  }
  if (item.id === "orders") {
    return pathname.startsWith("/pos/orders");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** True when a mobile bottom-nav item already represents the current route. */
export function isMobileBottomNavPathCovered(pathname: string, role: string): boolean {
  return getMobileBottomNavItems(role).some(
    (item) => item.action !== "menu" && isMobileBottomNavActive(item, pathname),
  );
}

/** Whether the topbar should show the mobile breadcrumb trail. */
export function shouldShowMobileBreadcrumb(
  pathname: string,
  role: string,
  options: { hubTabsVisible?: boolean } = {},
): boolean {
  if (options.hubTabsVisible) return false;
  if (isMobileBottomNavPathCovered(pathname, role)) return false;
  return true;
}

/** Maps mobile bottom-nav item ids to sidebar badge keys. */
export function getMobileBottomNavBadgeId(navItemId: string): string | null {
  if (navItemId === "inventory") return "inventory";
  if (navItemId === "kds") return "kds";
  if (navItemId === "more") return "aggregate";
  return null;
}
