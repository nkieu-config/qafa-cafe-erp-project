import { describe, expect, it } from "vitest";
import { computeSidebarChildTabBadges, computeSidebarNavBadges, formatSidebarBadgeCount, resolveMobileBottomNavBadge, buildSidebarBadgesFromNavCounts } from "./sidebar-badges";

describe("computeSidebarNavBadges", () => {
  it("counts inventory alerts and pending transfers", () => {
    const badges = computeSidebarNavBadges({
      role: "STAFF",
      branchInventory: [
        { id: 1, branchId: 2, ingredientId: 1, stock: 2, minStock: 5 },
      ],
      inventoryBatches: [
        {
          id: 1,
          branchId: 2,
          ingredientId: 2,
          quantity: 1,
          status: "ACTIVE",
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
      transfers: [
        { id: 1, status: "PENDING", toBranchId: 2, fromBranchId: 1, ingredientId: 1, quantity: 1, requestedById: 1, createdAt: "" },
      ],
      activeBranchId: 2,
    });
    expect(badges.inventory?.count).toBe(3);
  });

  it("includes procurement and finance badges for managers", () => {
    const badges = computeSidebarNavBadges({
      role: "MANAGER",
      purchaseOrders: [
        { id: 1, poNumber: "PO-1", branchId: 1, supplierId: 1, status: "PENDING", createdAt: "" },
      ],
      settlements: [
        {
          id: 1,
          branchId: 1,
          date: "2026-01-01",
          expectedCash: 0,
          actualCash: 0,
          difference: 0,
          status: "PENDING",
          submittedById: 1,
          createdAt: "2026-01-01",
        },
      ],
      leaveRequests: [{ id: 1, userId: 1, type: "ANNUAL", startDate: "", endDate: "", status: "PENDING" }],
    });
    expect(badges.procurement?.count).toBe(1);
    expect(badges.finance?.count).toBe(1);
    expect(badges.hr?.count).toBe(1);
  });

  it("omits manager-only badges for staff", () => {
    const badges = computeSidebarNavBadges({
      role: "STAFF",
      purchaseOrders: [
        { id: 1, poNumber: "PO-1", branchId: 1, supplierId: 1, status: "PENDING", createdAt: "" },
      ],
    });
    expect(badges.procurement).toBeUndefined();
  });

  it("shows KDS badge when kitchen orders are waiting", () => {
    const badges = computeSidebarNavBadges({
      role: "STAFF",
      activeBranchId: 1,
      kdsOrders: [
        {
          id: 1,
          queueNumber: 1,
          branchId: 1,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          items: [],
        },
      ],
    });
    expect(badges.kds?.count).toBe(1);
    expect(badges.kds?.tone).toBe("warning");
  });
});

describe("formatSidebarBadgeCount", () => {
  it("caps large counts", () => {
    expect(formatSidebarBadgeCount(120)).toBe("99+");
    expect(formatSidebarBadgeCount(3)).toBe("3");
  });
});

describe("computeSidebarChildTabBadges", () => {
  it("maps pending transfers to inventory transfers tab", () => {
    const child = computeSidebarChildTabBadges({
      role: "STAFF",
      transfers: [
        {
          id: 1,
          status: "PENDING",
          toBranchId: 2,
          fromBranchId: 1,
          ingredientId: 1,
          quantity: 1,
          requestedById: 1,
          createdAt: "",
        },
      ],
      activeBranchId: 2,
    });
    expect(child["/inventory/transfers"]?.count).toBe(1);
  });

  it("maps KDS orders to the kitchen tab", () => {
    const child = computeSidebarChildTabBadges({
      role: "STAFF",
      activeBranchId: 1,
      kdsOrders: [
        {
          id: 2,
          queueNumber: 2,
          branchId: 1,
          status: "PREPARING",
          createdAt: new Date().toISOString(),
          items: [],
        },
      ],
    });
    expect(child["/kds"]?.count).toBe(1);
  });

  it("maps low stock inventory to the balance tab", () => {
    const child = computeSidebarChildTabBadges({
      role: "STAFF",
      activeBranchId: 1,
      branchInventory: [
        { id: 1, branchId: 1, ingredientId: 1, stock: 1, minStock: 5 },
        { id: 2, branchId: 1, ingredientId: 2, stock: 10, minStock: 5 },
      ],
    });
    expect(child["/inventory"]?.count).toBe(1);
  });
});

describe("buildSidebarBadgesFromNavCounts", () => {
  it("builds parent and child badges from aggregate counts", () => {
    const { badges, childTabBadges } = buildSidebarBadgesFromNavCounts(
      {
        lowStock: 2,
        expiringBatches: 1,
        pendingTransfers: 1,
        kdsOrders: 3,
        pendingPurchaseOrders: 1,
        pendingSettlements: 1,
        pendingLeave: 2,
      },
      "MANAGER",
      1,
    );
    expect(badges.inventory?.count).toBe(4);
    expect(badges.kds?.count).toBe(3);
    expect(badges.procurement?.count).toBe(1);
    expect(childTabBadges["/inventory"]?.count).toBe(2);
    expect(childTabBadges["/inventory/batches"]?.count).toBe(1);
    expect(childTabBadges["/kds"]?.count).toBe(3);
  });
});

describe("resolveMobileBottomNavBadge", () => {
  it("aggregates all badges for the more item", () => {
    const badge = resolveMobileBottomNavBadge("more", {
      inventory: { count: 2, tone: "warning", label: "2 alerts" },
      procurement: { count: 1, tone: "warning", label: "1 PO" },
    });
    expect(badge?.count).toBe(3);
  });

  it("returns inventory badge for stock tab", () => {
    const badge = resolveMobileBottomNavBadge("inventory", {
      inventory: { count: 4, tone: "warning", label: "4 alerts" },
    });
    expect(badge?.count).toBe(4);
  });

  it("returns kds badge for kitchen tab", () => {
    const badge = resolveMobileBottomNavBadge("kds", {
      kds: { count: 3, tone: "warning", label: "3 orders" },
    });
    expect(badge?.count).toBe(3);
  });
});
