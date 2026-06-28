import type { LeaveRequest, PurchaseOrder, Settlement, StockTransfer, BranchInventory, InventoryBatch } from "@/types/api";
import { normalizeKdsOrders } from "@/lib/kds-utils";
import type { Order } from "@/types/api";
import { countExpiringBatches, countLowStockRecords } from "@/lib/inventory-alerts";

export type SidebarNavBadgeTone = "warning" | "danger" | "info";

export type SidebarNavBadge = {
  count: number;
  tone: SidebarNavBadgeTone;
  label: string;
};

export type SidebarNavBadgeMap = Partial<Record<string, SidebarNavBadge>>;

/** Aggregate counts from GET /nav-counts — single source for badge polling. */
export type NavCountsSnapshot = {
  lowStock: number;
  expiringBatches: number;
  pendingTransfers: number;
  kdsOrders: number;
  pendingPurchaseOrders: number;
  pendingSettlements: number;
  pendingLeave: number;
};

type ComputeBadgeInput = {
  role?: string;
  branchInventory?: BranchInventory[] | null;
  inventoryBatches?: InventoryBatch[] | null;
  purchaseOrders?: PurchaseOrder[] | null;
  settlements?: Settlement[] | null;
  leaveRequests?: LeaveRequest[] | null;
  transfers?: StockTransfer[] | null;
  kdsOrders?: Order[] | null;
  activeBranchId?: number | null;
};

function countPendingPurchaseOrders(orders: PurchaseOrder[], activeBranchId?: number | null) {
  return orders.filter(
    (po) =>
      po.status === "PENDING" &&
      (activeBranchId == null || po.branchId === activeBranchId),
  ).length;
}

function countPendingSettlements(settlements: Settlement[], activeBranchId?: number | null) {
  return settlements.filter(
    (s) =>
      s.status === "PENDING" &&
      (activeBranchId == null || s.branchId === activeBranchId),
  ).length;
}

function countPendingLeave(requests: LeaveRequest[]) {
  return requests.filter((req) => req.status === "PENDING").length;
}

function extractNavCountsFromInput(input: ComputeBadgeInput): NavCountsSnapshot {
  const { branchInventory, inventoryBatches, purchaseOrders, settlements, leaveRequests, transfers, kdsOrders, activeBranchId } = input;
  return {
    lowStock: countLowStockRecords(branchInventory),
    expiringBatches: countExpiringBatches(inventoryBatches),
    pendingTransfers: countPendingIncomingTransfers(transfers, activeBranchId),
    kdsOrders: activeBranchId != null && kdsOrders ? normalizeKdsOrders(kdsOrders).length : 0,
    pendingPurchaseOrders: purchaseOrders ? countPendingPurchaseOrders(purchaseOrders, activeBranchId) : 0,
    pendingSettlements: settlements ? countPendingSettlements(settlements, activeBranchId) : 0,
    pendingLeave: leaveRequests ? countPendingLeave(leaveRequests) : 0,
  };
}

export function buildSidebarBadgesFromNavCounts(
  counts: NavCountsSnapshot,
  role?: string,
  activeBranchId?: number | null,
): { badges: SidebarNavBadgeMap; childTabBadges: SidebarNavBadgeMap } {
  const badges: SidebarNavBadgeMap = {};
  const childTabBadges: SidebarNavBadgeMap = {};
  const isManagerOrAdmin = role === "SUPER_ADMIN" || role === "MANAGER";

  const inventoryCount = counts.lowStock + counts.expiringBatches + counts.pendingTransfers;
  if (inventoryCount > 0) {
    badges.inventory = {
      count: inventoryCount,
      tone: inventoryCount >= 5 ? "danger" : "warning",
      label: `${inventoryCount} inventory alert${inventoryCount === 1 ? "" : "s"}`,
    };
  }

  if (activeBranchId != null && counts.kdsOrders > 0) {
    badges.kds = {
      count: counts.kdsOrders,
      tone: counts.kdsOrders >= 5 ? "danger" : "warning",
      label: `${counts.kdsOrders} kitchen order${counts.kdsOrders === 1 ? "" : "s"} waiting`,
    };
  }

  if (isManagerOrAdmin && counts.pendingPurchaseOrders > 0) {
    badges.procurement = {
      count: counts.pendingPurchaseOrders,
      tone: "warning",
      label: `${counts.pendingPurchaseOrders} purchase order${counts.pendingPurchaseOrders === 1 ? "" : "s"} awaiting approval`,
    };
  }

  if (isManagerOrAdmin && counts.pendingSettlements > 0) {
    badges.finance = {
      count: counts.pendingSettlements,
      tone: "warning",
      label: `${counts.pendingSettlements} settlement${counts.pendingSettlements === 1 ? "" : "s"} awaiting approval`,
    };
  }

  if (isManagerOrAdmin && counts.pendingLeave > 0) {
    badges.hr = {
      count: counts.pendingLeave,
      tone: "info",
      label: `${counts.pendingLeave} leave request${counts.pendingLeave === 1 ? "" : "s"} pending`,
    };
  }

  if (counts.pendingTransfers > 0) {
    childTabBadges["/inventory/transfers"] = {
      count: counts.pendingTransfers,
      tone: "warning",
      label: `${counts.pendingTransfers} pending transfer${counts.pendingTransfers === 1 ? "" : "s"}`,
    };
  }

  if (counts.expiringBatches > 0) {
    childTabBadges["/inventory/batches"] = {
      count: counts.expiringBatches,
      tone: counts.expiringBatches >= 3 ? "danger" : "warning",
      label: `${counts.expiringBatches} expiry alert${counts.expiringBatches === 1 ? "" : "s"}`,
    };
  }

  if (counts.lowStock > 0) {
    childTabBadges["/inventory"] = {
      count: counts.lowStock,
      tone: counts.lowStock >= 3 ? "danger" : "warning",
      label: `${counts.lowStock} low stock alert${counts.lowStock === 1 ? "" : "s"}`,
    };
  }

  if (isManagerOrAdmin && counts.pendingPurchaseOrders > 0) {
    childTabBadges["/procurement/orders"] = {
      count: counts.pendingPurchaseOrders,
      tone: "warning",
      label: `${counts.pendingPurchaseOrders} PO${counts.pendingPurchaseOrders === 1 ? "" : "s"} awaiting approval`,
    };
  }

  if (isManagerOrAdmin && counts.pendingSettlements > 0) {
    childTabBadges["/finance/overview"] = {
      count: counts.pendingSettlements,
      tone: "warning",
      label: `${counts.pendingSettlements} settlement${counts.pendingSettlements === 1 ? "" : "s"} pending`,
    };
  }

  if (isManagerOrAdmin && counts.pendingLeave > 0) {
    childTabBadges["/hr/leave"] = {
      count: counts.pendingLeave,
      tone: "info",
      label: `${counts.pendingLeave} leave request${counts.pendingLeave === 1 ? "" : "s"} pending`,
    };
  }

  if (activeBranchId != null && counts.kdsOrders > 0) {
    childTabBadges["/kds"] = {
      count: counts.kdsOrders,
      tone: counts.kdsOrders >= 5 ? "danger" : "warning",
      label: `${counts.kdsOrders} kitchen order${counts.kdsOrders === 1 ? "" : "s"} waiting`,
    };
  }

  return { badges, childTabBadges };
}

/** Derive sidebar nav badge counts from fetched operational data. */
export function computeSidebarNavBadges(input: ComputeBadgeInput): SidebarNavBadgeMap {
  return buildSidebarBadgesFromNavCounts(
    extractNavCountsFromInput(input),
    input.role,
    input.activeBranchId,
  ).badges;
}

export function formatSidebarBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function countPendingIncomingTransfers(
  transfers: StockTransfer[] | null | undefined,
  activeBranchId?: number | null,
) {
  return (
    transfers?.filter(
      (t) =>
        t.status === "PENDING" &&
        (activeBranchId == null || t.toBranchId === activeBranchId),
    ).length ?? 0
  );
}

/** Tab-path badges for sidebar tree children (keyed by hub tab path). */
export function computeSidebarChildTabBadges(input: ComputeBadgeInput): SidebarNavBadgeMap {
  return buildSidebarBadgesFromNavCounts(
    extractNavCountsFromInput(input),
    input.role,
    input.activeBranchId,
  ).childTabBadges;
}

/** Resolve a badge for a mobile bottom-nav item (supports aggregate on "more"). */
export function resolveMobileBottomNavBadge(
  navItemId: string,
  badges: SidebarNavBadgeMap,
): SidebarNavBadge | undefined {
  const mappedId = getMobileBottomNavBadgeKey(navItemId);
  if (mappedId === "aggregate") {
    const values = Object.values(badges).filter((badge): badge is SidebarNavBadge => badge != null);
    const total = values.reduce((sum, badge) => sum + badge.count, 0);
    if (total <= 0) return undefined;
    const hasDanger = values.some((badge) => badge.tone === "danger");
    return {
      count: total,
      tone: hasDanger ? "danger" : "warning",
      label: `${total} pending notification${total === 1 ? "" : "s"}`,
    };
  }
  if (mappedId) return badges[mappedId];
  return undefined;
}

function getMobileBottomNavBadgeKey(navItemId: string): string | null | "aggregate" {
  if (navItemId === "inventory") return "inventory";
  if (navItemId === "kds") return "kds";
  if (navItemId === "more") return "aggregate";
  return null;
}
