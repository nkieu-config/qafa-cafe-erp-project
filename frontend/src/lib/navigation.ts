import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Gift,
  ClipboardList,
  Truck,
  ChefHat,
  UserSquare2,
  Landmark,
  Wrench,
  Building2,
  ShieldCheck,
  Settings,
  MonitorPlay,
  PackageOpen,
  ClipboardCheck,
  ArrowRightLeft,
  Trash2,
  ArrowDownToLine,
  Store,
  FileCheck,
  Users,
  CalendarDays,
  Clock,
  Briefcase,
  Wallet,
  BarChart3,
  Leaf,
  SlidersHorizontal,
  ListTree,
  TicketPercent,
  BookOpen,
  Receipt,
  History,
  Menu,
} from "lucide-react";
import type { Role } from "@/types/api";

export type NavRole = Role;

export type SidebarItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: NavRole[];
};

export type SidebarGroup = {
  group: string;
  items: SidebarItem[];
};

export type HubTab = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: NavRole[];
  /** Lower numbers appear first. Used for role-specific ordering. */
  order?: Partial<Record<NavRole, number>>;
};

export type HubId =
  | "inventory"
  | "procurement"
  | "hr"
  | "products"
  | "kitchen"
  | "crm"
  | "finance"
  | "assets"
  | "pos"
  | "settings"
  | "organization";

export type HubConfig = {
  id: HubId;
  label: string;
  description: string;
  icon: LucideIcon;
  basePath: string;
  tabs: HubTab[];
  wrapAntd?: boolean;
};

/** Canonical labels for URL segments used in breadcrumbs. */
export const PATH_LABELS: Record<string, string> = {
  inventory: "Inventory",
  stock: "Batches & Expiry",
  batches: "Batches & Expiry",
  "stock-in": "Receive Stock (GRN)",
  transfers: "Stock Transfers",
  waste: "Waste Logs",
  procurement: "Procurement",
  suppliers: "Suppliers",
  orders: "Purchase Orders",
  products: "Products",
  ingredients: "Raw Ingredients",
  modifiers: "Modifiers",
  costing: "Food Cost",
  kitchen: "Central Kitchen",
  boms: "Production BOM",
  hr: "Human Resources",
  employees: "Employee Directory",
  shifts: "Shift Management",
  attendance: "Attendance",
  leave: "Leave Requests",
  payroll: "Payroll",
  crm: "CRM",
  customers: "Customers & Loyalty",
  promotions: "Campaigns",
  finance: "Finance",
  overview: "Overview",
  ledger: "General Ledger",
  accounts: "Chart of Accounts",
  assets: "Assets",
  equipment: "Equipment",
  pos: "Point of Sale",
  terminal: "Terminal",
  settlement: "Settlement",
  settings: "Settings",
  audit: "Audit Trail",
  organization: "Organization",
  branches: "Branches",
  users: "Users & Roles",
  kds: "Kitchen Display",
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    group: "Overview & Analytics",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },
  {
    group: "Store Operations",
    items: [
      {
        id: "pos",
        label: "Point of Sale",
        href: "/pos",
        icon: ShoppingCart,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "kds",
        label: "Kitchen Display",
        href: "/kds",
        icon: MonitorPlay,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "inventory",
        label: "Inventory",
        href: "/inventory",
        icon: Package,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "crm",
        label: "CRM",
        href: "/crm",
        icon: Gift,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },
  {
    group: "Back Office",
    items: [
      {
        id: "products",
        label: "Products",
        href: "/products",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "procurement",
        label: "Procurement",
        href: "/procurement",
        icon: Truck,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "kitchen",
        label: "Central Kitchen",
        href: "/kitchen",
        icon: ChefHat,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "hr",
        label: "Human Resources",
        href: "/hr",
        icon: UserSquare2,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "finance",
        label: "Finance",
        href: "/finance",
        icon: Landmark,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "assets",
        label: "Assets",
        href: "/assets",
        icon: Wrench,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  {
    group: "System Admin",
    items: [
      {
        id: "organization",
        label: "Organization",
        href: "/organization",
        icon: Building2,
        roles: ["SUPER_ADMIN"],
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

export const HUBS: Record<HubId, HubConfig> = {
  inventory: {
    id: "inventory",
    label: "Inventory",
    description: "Manage stock levels, batches, receipts, transfers, and waste.",
    icon: Package,
    basePath: "/inventory",
    wrapAntd: true,
    tabs: [
      {
        id: "balance",
        label: "Overview",
        path: "/inventory",
        icon: PackageOpen,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "batches",
        label: "Batches & Expiry",
        path: "/inventory/batches",
        icon: ClipboardCheck,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "grn",
        label: "Receive Stock (GRN)",
        path: "/inventory/stock-in",
        icon: ArrowDownToLine,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "transfers",
        label: "Stock Transfers",
        path: "/inventory/transfers",
        icon: ArrowRightLeft,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "waste",
        label: "Waste Logs",
        path: "/inventory/waste",
        icon: Trash2,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  procurement: {
    id: "procurement",
    label: "Procurement",
    description: "Manage suppliers and purchase orders.",
    icon: Truck,
    basePath: "/procurement",
    wrapAntd: true,
    tabs: [
      {
        id: "suppliers",
        label: "Suppliers",
        path: "/procurement/suppliers",
        icon: Store,
        roles: ["SUPER_ADMIN", "MANAGER"],
        order: { SUPER_ADMIN: 1, MANAGER: 1, STAFF: 99 },
      },
      {
        id: "orders",
        label: "Purchase Orders",
        path: "/procurement/orders",
        icon: FileCheck,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
        order: { SUPER_ADMIN: 2, MANAGER: 2, STAFF: 1 },
      },
    ],
  },
  hr: {
    id: "hr",
    label: "Human Resources",
    description: "Manage staff, shifts, attendance, and payroll.",
    icon: UserSquare2,
    basePath: "/hr",
    wrapAntd: true,
    tabs: [
      {
        id: "employees",
        label: "Employee Directory",
        path: "/hr/employees",
        icon: Users,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
        order: { SUPER_ADMIN: 1, MANAGER: 1, STAFF: 3 },
      },
      {
        id: "shifts",
        label: "Shift Management",
        path: "/hr/shifts",
        icon: CalendarDays,
        roles: ["SUPER_ADMIN", "MANAGER"],
        order: { SUPER_ADMIN: 2, MANAGER: 2 },
      },
      {
        id: "attendance",
        label: "Attendance",
        path: "/hr/attendance",
        icon: Clock,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
        order: { SUPER_ADMIN: 3, MANAGER: 3, STAFF: 1 },
      },
      {
        id: "leave",
        label: "Leave Requests",
        path: "/hr/leave",
        icon: Briefcase,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
        order: { SUPER_ADMIN: 4, MANAGER: 4, STAFF: 2 },
      },
      {
        id: "payroll",
        label: "Payroll",
        path: "/hr/payroll",
        icon: Wallet,
        roles: ["SUPER_ADMIN", "MANAGER"],
        order: { SUPER_ADMIN: 5, MANAGER: 5 },
      },
    ],
  },
  products: {
    id: "products",
    label: "Products",
    description: "Manage menu catalog, ingredients, modifiers, and food cost.",
    icon: ClipboardList,
    basePath: "/products",
    wrapAntd: true,
    tabs: [
      {
        id: "menu",
        label: "Menu Items",
        path: "/products",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "ingredients",
        label: "Raw Ingredients",
        path: "/products/ingredients",
        icon: Leaf,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "modifiers",
        label: "Modifiers",
        path: "/products/modifiers",
        icon: SlidersHorizontal,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "costing",
        label: "Food Cost",
        path: "/products/costing",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  kitchen: {
    id: "kitchen",
    label: "Central Kitchen",
    description: "Manage production orders and production BOMs.",
    icon: ChefHat,
    basePath: "/kitchen",
    wrapAntd: true,
    tabs: [
      {
        id: "production",
        label: "Production Orders",
        path: "/kitchen",
        icon: ChefHat,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "boms",
        label: "Production BOM",
        path: "/kitchen/boms",
        icon: ListTree,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  crm: {
    id: "crm",
    label: "CRM",
    description: "Manage customer loyalty and marketing campaigns.",
    icon: Gift,
    basePath: "/crm",
    wrapAntd: true,
    tabs: [
      {
        id: "customers",
        label: "Customers & Loyalty",
        path: "/crm/customers",
        icon: Users,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "promotions",
        label: "Campaigns",
        path: "/crm/promotions",
        icon: TicketPercent,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  finance: {
    id: "finance",
    label: "Finance",
    description: "Manage HQ finances, ledger, and accounts.",
    icon: Landmark,
    basePath: "/finance",
    wrapAntd: true,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        path: "/finance/overview",
        icon: Wallet,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "ledger",
        label: "General Ledger",
        path: "/finance/ledger",
        icon: BookOpen,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "accounts",
        label: "Chart of Accounts",
        path: "/finance/accounts",
        icon: Landmark,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  assets: {
    id: "assets",
    label: "Assets",
    description: "Register equipment and track maintenance for store assets.",
    icon: Wrench,
    basePath: "/assets",
    wrapAntd: true,
    tabs: [
      {
        id: "equipment",
        label: "Equipment",
        path: "/assets",
        icon: Wrench,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  pos: {
    id: "pos",
    label: "Point of Sale",
    description: "Process sales and manage cash register.",
    icon: ShoppingCart,
    basePath: "/pos",
    wrapAntd: false,
    tabs: [
      {
        id: "terminal",
        label: "Terminal",
        path: "/pos/terminal",
        icon: ShoppingCart,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
      {
        id: "orders",
        label: "Orders",
        path: "/pos/orders",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
      {
        id: "settlement",
        label: "Settlement",
        path: "/pos/settlement",
        icon: Wallet,
        roles: ["SUPER_ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },
  settings: {
    id: "settings",
    label: "Settings",
    description: "Global settings and audit logs for the ERP.",
    icon: Settings,
    basePath: "/settings",
    wrapAntd: false,
    tabs: [
      { id: "general", label: "General", path: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
      { id: "audit", label: "Audit Trail", path: "/settings/audit", icon: History, roles: ["SUPER_ADMIN"] },
    ],
  },
  organization: {
    id: "organization",
    label: "Organization",
    description: "Manage branches, locations, and user access.",
    icon: Building2,
    basePath: "/organization",
    wrapAntd: true,
    tabs: [
      {
        id: "branches",
        label: "Branches",
        path: "/organization/branches",
        icon: Building2,
        roles: ["SUPER_ADMIN"],
      },
      {
        id: "users",
        label: "Users & Roles",
        path: "/organization/users",
        icon: ShieldCheck,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
};

export type MobileBottomNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: NavRole[];
  /** Opens the full navigation sheet instead of navigating. */
  action?: "menu";
};

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

export const FLAT_SIDEBAR_ITEMS = SIDEBAR_GROUPS.flatMap((g) => g.items);

const SIDEBAR_HUB_IDS = new Set<HubId>([
  "inventory",
  "procurement",
  "hr",
  "products",
  "kitchen",
  "crm",
  "finance",
  "assets",
  "pos",
  "settings",
  "organization",
]);

/** Maps a sidebar item id to its hub config when the item represents a hub. */
export function resolveSidebarHubId(itemId: string): HubId | null {
  if (SIDEBAR_HUB_IDS.has(itemId as HubId)) {
    return itemId as HubId;
  }
  return null;
}

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

export function resolvePathLabel(segment: string): string {
  return PATH_LABELS[segment] ?? segment.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export type BreadcrumbItem = {
  label: string;
  href: string | null;
};

export function resolveBreadcrumb(pathname: string): { section: string; subsection: string | null } {
  const trail = resolveBreadcrumbTrail(pathname);
  if (trail.length === 0) {
    return { section: "Dashboard", subsection: null };
  }
  if (trail.length === 1) {
    return { section: trail[0].label, subsection: null };
  }
  return {
    section: trail[0].label,
    subsection: trail[trail.length - 1].label,
  };
}

/** Canonical href for breadcrumb section links (handles legacy redirects). */
function resolveHubHref(pathname: string): string {
  if (pathname === "/branches" || pathname.startsWith("/branches/")) {
    return "/organization/branches";
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return "/organization/users";
  }
  if (pathname === "/inventory/stock" || pathname.startsWith("/inventory/stock/")) {
    return "/inventory/batches";
  }
  if (pathname === "/procurement/transfers" || pathname.startsWith("/procurement/transfers/")) {
    return "/inventory/transfers";
  }

  const activeSidebar = findActiveSidebarItem(pathname);
  return activeSidebar?.href ?? `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
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

function resolveHubBreadcrumbTrail(pathname: string, hub: HubConfig): BreadcrumbItem[] {
  const activeTab = findActiveTabForPathname(pathname, hub);

  if (!activeTab) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1 && pathname === hub.basePath) {
      return [{ label: hub.label, href: null }];
    }

    const trail: BreadcrumbItem[] = [{ label: hub.label, href: hub.basePath }];
    if (parts.length > 1) {
      const subsectionLabel = resolvePathLabel(parts[parts.length - 1]);
      if (subsectionLabel !== hub.label) {
        trail.push({ label: subsectionLabel, href: null });
      }
    }
    return trail;
  }

  const onHubRoot = pathname === hub.basePath && activeTab.path === hub.basePath;
  if (onHubRoot) {
    return [{ label: hub.label, href: null }];
  }

  const nestedUnderTab =
    activeTab.path !== hub.basePath && pathname.startsWith(`${activeTab.path}/`);

  if (nestedUnderTab) {
    const nestedSegment = pathname.slice(activeTab.path.length + 1).split("/").filter(Boolean)[0];
    const trail: BreadcrumbItem[] = [
      { label: hub.label, href: hub.basePath },
      { label: activeTab.label, href: activeTab.path },
    ];
    if (nestedSegment) {
      trail.push({ label: resolvePathLabel(nestedSegment), href: null });
    }
    return trail;
  }

  return [
    { label: hub.label, href: hub.basePath },
    { label: activeTab.label, href: null },
  ];
}

function normalizeBreadcrumbPathname(pathname: string): string {
  if (pathname === "/inventory/stock" || pathname.startsWith("/inventory/stock/")) {
    return pathname.replace("/inventory/stock", "/inventory/batches");
  }
  if (pathname === "/procurement/transfers" || pathname.startsWith("/procurement/transfers/")) {
    return pathname.replace("/procurement/transfers", "/inventory/transfers");
  }
  if (pathname === "/branches" || pathname.startsWith("/branches/")) {
    return pathname.replace(/^\/branches/, "/organization/branches");
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return pathname.replace(/^\/users/, "/organization/users");
  }
  return pathname;
}

export function resolveBreadcrumbTrail(pathname: string): BreadcrumbItem[] {
  const normalizedPath = normalizeBreadcrumbPathname(pathname);

  if (normalizedPath === "/" || normalizedPath === "") {
    return [{ label: "Dashboard", href: null }];
  }

  const hub = findHubByPathname(normalizedPath);
  if (hub) {
    return resolveHubBreadcrumbTrail(normalizedPath, hub);
  }

  const parts = normalizedPath.split("/").filter(Boolean);
  const hubHref = resolveHubHref(normalizedPath);
  const sectionLabel = resolvePathLabel(parts[0]);

  if (parts.length === 1 && normalizedPath === hubHref) {
    return [{ label: sectionLabel, href: null }];
  }

  const trail: BreadcrumbItem[] = [{ label: sectionLabel, href: hubHref }];

  if (parts.length > 1) {
    const tabPath = `/${parts.slice(0, 2).join("/")}`;
    const tabLabel = resolvePathLabel(parts[1]);
    const hasNestedRoute = parts.length > 2;

    if (tabLabel !== sectionLabel) {
      trail.push({
        label: tabLabel,
        href: hasNestedRoute ? tabPath : null,
      });
    }

    if (hasNestedRoute) {
      trail.push({ label: resolvePathLabel(parts[parts.length - 1]), href: null });
    }
  }

  return trail;
}

export function findActiveSidebarItem(pathname: string): SidebarItem | undefined {
  return [...FLAT_SIDEBAR_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`))
    );
}

/** Legacy paths that redirect to new locations — still match sidebar active state. */
const LEGACY_PATH_PREFIXES: Record<string, string> = {
  "/branches": "/organization",
  "/users": "/organization",
  "/inventory/stock": "/inventory",
  "/procurement/transfers": "/inventory",
  "/assets/equipment": "/assets",
};

export function isSidebarItemActive(item: SidebarItem, pathname: string): boolean {
  let resolvedPath = pathname;
  for (const [legacy, target] of Object.entries(LEGACY_PATH_PREFIXES)) {
    if (pathname === legacy || pathname.startsWith(`${legacy}/`)) {
      resolvedPath = pathname.replace(legacy, target);
      break;
    }
  }

  const activeItem = findActiveSidebarItem(resolvedPath);
  if (activeItem) {
    return item.href === activeItem.href;
  }

  for (const [legacy, target] of Object.entries(LEGACY_PATH_PREFIXES)) {
    if (pathname === legacy || pathname.startsWith(`${legacy}/`)) {
      return item.href === target || item.href.startsWith(target);
    }
  }

  return item.href === "/" && pathname === "/";
}
