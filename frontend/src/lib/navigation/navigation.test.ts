import { describe, expect, it } from "vitest";
import {
  HUBS,
  findHubByPathname,
  getMobileBottomNavBadgeId,
  getMobileBottomNavItems,
  getVisibleHubTabs,
  isMobileBottomNavActive,
  isMobileBottomNavPathCovered,
  isTabActive,
  shouldShowHubSubNav,
  shouldShowMobileBreadcrumb,
  resolveBreadcrumbTrail,
  resolveHubShellTitle,
  resolveSidebarHubId,
  isRedundantPageTitle,
  isSidebarItemActive,
  FLAT_SIDEBAR_ITEMS,
} from "./index";

describe("resolveBreadcrumbTrail", () => {
  it("returns dashboard for root path", () => {
    expect(resolveBreadcrumbTrail("/")).toEqual([{ label: "Dashboard", href: null }]);
  });

  it("returns hub-only trail on hub root tab", () => {
    expect(resolveBreadcrumbTrail("/inventory")).toEqual([
      { label: "Inventory", href: null },
    ]);
  });

  it("returns hub and tab with tab linkable from hub", () => {
    expect(resolveBreadcrumbTrail("/inventory/batches")).toEqual([
      { label: "Inventory", href: "/inventory" },
      { label: "Batches & Expiry", href: null },
    ]);
  });

  it("returns three levels when nested under a tab", () => {
    expect(resolveBreadcrumbTrail("/inventory/batches/lot-42")).toEqual([
      { label: "Inventory", href: "/inventory" },
      { label: "Batches & Expiry", href: "/inventory/batches" },
      { label: "Lot 42", href: null },
    ]);
  });

  it("normalizes legacy stock path to batches tab", () => {
    expect(resolveBreadcrumbTrail("/inventory/stock")).toEqual([
      { label: "Inventory", href: "/inventory" },
      { label: "Batches & Expiry", href: null },
    ]);
  });

  it("handles organization hub tabs", () => {
    expect(resolveBreadcrumbTrail("/organization/users")).toEqual([
      { label: "Organization", href: "/organization" },
      { label: "Users & Roles", href: null },
    ]);
  });
});

describe("findHubByPathname", () => {
  it("finds inventory hub for nested routes", () => {
    expect(findHubByPathname("/inventory/transfers")?.id).toBe("inventory");
  });
});

describe("isTabActive", () => {
  it("matches exact base path only for default tab", () => {
    expect(isTabActive("/inventory", "/inventory", "/inventory")).toBe(true);
    expect(isTabActive("/inventory/batches", "/inventory", "/inventory")).toBe(false);
  });

  it("matches nested paths for non-base tabs", () => {
    expect(isTabActive("/inventory/batches/lot-1", "/inventory/batches", "/inventory")).toBe(
      true,
    );
  });
});

describe("hub completeness", () => {
  it("every hub defines at least one tab", () => {
    for (const hub of Object.values(HUBS)) {
      expect(hub.tabs.length, hub.id).toBeGreaterThan(0);
    }
  });

  it("assets hub serves equipment at /assets", () => {
    const assets = HUBS.assets;
    expect(assets.tabs.some((tab) => tab.path === "/assets")).toBe(true);
  });

  it("shouldShowHubSubNav hides single root tab hubs", () => {
    expect(shouldShowHubSubNav(HUBS.assets.tabs, HUBS.assets.basePath)).toBe(false);
    expect(shouldShowHubSubNav(HUBS.inventory.tabs, HUBS.inventory.basePath)).toBe(true);
  });
});

describe("resolveHubShellTitle", () => {
  it("uses tab label on root when it differs from hub label", () => {
    expect(resolveHubShellTitle("/inventory", HUBS.inventory)).toBe("Overview");
  });

  it("uses tab label for single-tab hubs when it differs from hub label", () => {
    expect(resolveHubShellTitle("/assets", HUBS.assets)).toBe("Equipment");
  });

  it("uses active tab label on sub-routes", () => {
    expect(resolveHubShellTitle("/finance/overview", HUBS.finance)).toBe("Overview");
    expect(resolveHubShellTitle("/inventory/batches", HUBS.inventory)).toBe("Batches & Expiry");
  });

  it("detects redundant page titles", () => {
    expect(isRedundantPageTitle("Overview", "/finance/overview", HUBS.finance)).toBe(true);
    expect(isRedundantPageTitle("Finance & Settlement", "/finance/overview", HUBS.finance)).toBe(false);
  });
});

describe("getVisibleHubTabs", () => {
  it("orders purchase orders first for staff in procurement", () => {
    const tabs = getVisibleHubTabs("procurement", "STAFF");
    expect(tabs[0]?.path).toBe("/procurement/orders");
  });

  it("orders suppliers first for manager in procurement", () => {
    const tabs = getVisibleHubTabs("procurement", "MANAGER");
    expect(tabs[0]?.path).toBe("/procurement/suppliers");
  });

  it("filters tabs by role", () => {
    const staffHrTabs = getVisibleHubTabs("hr", "STAFF");
    expect(staffHrTabs.some((tab) => tab.path === "/hr/payroll")).toBe(false);
    expect(staffHrTabs.some((tab) => tab.path === "/hr/employees")).toBe(true);
  });

  it("hides manager-only POS and inventory tabs from staff", () => {
    const staffPosTabs = getVisibleHubTabs("pos", "STAFF");
    expect(staffPosTabs.some((tab) => tab.path === "/pos/orders")).toBe(false);
    expect(staffPosTabs.some((tab) => tab.path === "/pos/terminal")).toBe(true);

    const staffInventoryTabs = getVisibleHubTabs("inventory", "STAFF");
    expect(staffInventoryTabs.some((tab) => tab.path === "/inventory/stock-in")).toBe(false);
    expect(staffInventoryTabs.some((tab) => tab.path === "/inventory/waste")).toBe(false);
    expect(staffInventoryTabs.some((tab) => tab.path === "/inventory")).toBe(true);
  });

  it("shows manager-only POS and inventory tabs for managers", () => {
    const managerPosTabs = getVisibleHubTabs("pos", "MANAGER");
    expect(managerPosTabs.some((tab) => tab.path === "/pos/orders")).toBe(true);

    const managerInventoryTabs = getVisibleHubTabs("inventory", "MANAGER");
    expect(managerInventoryTabs.some((tab) => tab.path === "/inventory/stock-in")).toBe(true);
    expect(managerInventoryTabs.some((tab) => tab.path === "/inventory/waste")).toBe(true);
  });
});

describe("getMobileBottomNavItems", () => {
  it("returns four items for staff with KDS instead of orders", () => {
    const items = getMobileBottomNavItems("STAFF");
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.id)).toEqual(["pos", "kds", "inventory", "more"]);
  });

  it("returns orders for manager instead of KDS", () => {
    const items = getMobileBottomNavItems("MANAGER");
    expect(items.map((item) => item.id)).toEqual(["pos", "orders", "inventory", "more"]);
  });

  it("marks POS active on terminal but not orders", () => {
    const pos = getMobileBottomNavItems("STAFF")[0];
    expect(isMobileBottomNavActive(pos, "/pos/terminal")).toBe(true);
    expect(isMobileBottomNavActive(pos, "/pos/orders")).toBe(false);
  });
});

describe("resolveSidebarHubId", () => {
  it("maps hub sidebar items to hub ids", () => {
    expect(resolveSidebarHubId("inventory")).toBe("inventory");
    expect(resolveSidebarHubId("pos")).toBe("pos");
  });

  it("returns aggregate key for more item", () => {
    expect(getMobileBottomNavBadgeId("more")).toBe("aggregate");
  });

  it("returns kds key for kitchen bottom nav", () => {
    expect(getMobileBottomNavBadgeId("kds")).toBe("kds");
  });

  it("returns null for non-hub items", () => {
    expect(resolveSidebarHubId("dashboard")).toBeNull();
    expect(resolveSidebarHubId("kds")).toBeNull();
  });
});

describe("mobile breadcrumb visibility", () => {
  it("detects paths covered by bottom nav", () => {
    expect(isMobileBottomNavPathCovered("/pos/terminal", "MANAGER")).toBe(true);
    expect(isMobileBottomNavPathCovered("/inventory", "STAFF")).toBe(true);
    expect(isMobileBottomNavPathCovered("/inventory/batches", "STAFF")).toBe(true);
    expect(isMobileBottomNavPathCovered("/finance/overview", "MANAGER")).toBe(false);
  });

  it("hides mobile breadcrumb when bottom nav covers route", () => {
    expect(shouldShowMobileBreadcrumb("/pos/terminal", "MANAGER")).toBe(false);
    expect(shouldShowMobileBreadcrumb("/inventory/batches", "STAFF")).toBe(false);
    expect(shouldShowMobileBreadcrumb("/finance/overview", "MANAGER")).toBe(true);
  });

  it("hides mobile breadcrumb when hub tabs are visible", () => {
    expect(
      shouldShowMobileBreadcrumb("/finance/overview", "MANAGER", { hubTabsVisible: true }),
    ).toBe(false);
    expect(
      shouldShowMobileBreadcrumb("/finance/overview", "MANAGER", { hubTabsVisible: false }),
    ).toBe(true);
  });
});

describe("legacy breadcrumb paths", () => {
  it("maps procurement transfers redirect to inventory transfers tab", () => {
    expect(resolveBreadcrumbTrail("/procurement/transfers")).toEqual([
      { label: "Inventory", href: "/inventory" },
      { label: "Stock Transfers", href: null },
    ]);
  });

  it("maps legacy users path to organization users tab", () => {
    expect(resolveBreadcrumbTrail("/users")).toEqual([
      { label: "Organization", href: "/organization" },
      { label: "Users & Roles", href: null },
    ]);
  });
});

describe("isSidebarItemActive legacy paths", () => {
  const organizationItem = FLAT_SIDEBAR_ITEMS.find((item) => item.id === "organization");
  const inventoryItem = FLAT_SIDEBAR_ITEMS.find((item) => item.id === "inventory");
  const assetsItem = FLAT_SIDEBAR_ITEMS.find((item) => item.id === "assets");

  it("highlights organization for legacy /users", () => {
    expect(organizationItem).toBeDefined();
    expect(isSidebarItemActive(organizationItem!, "/users")).toBe(true);
  });

  it("highlights organization for legacy /branches", () => {
    expect(organizationItem).toBeDefined();
    expect(isSidebarItemActive(organizationItem!, "/branches")).toBe(true);
  });

  it("highlights inventory for legacy /inventory/stock", () => {
    expect(inventoryItem).toBeDefined();
    expect(isSidebarItemActive(inventoryItem!, "/inventory/stock")).toBe(true);
  });

  it("highlights inventory for legacy /procurement/transfers", () => {
    expect(inventoryItem).toBeDefined();
    expect(isSidebarItemActive(inventoryItem!, "/procurement/transfers")).toBe(true);
  });

  it("highlights assets for legacy /assets/equipment", () => {
    expect(assetsItem).toBeDefined();
    expect(isSidebarItemActive(assetsItem!, "/assets/equipment")).toBe(true);
  });
});
