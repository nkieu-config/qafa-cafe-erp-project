"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/endpoints";
import { fetchAPI } from "@/lib/api";
import {
  buildSidebarBadgesFromNavCounts,
  type NavCountsSnapshot,
  type SidebarNavBadgeMap,
} from "@/lib/sidebar-badges";
import { NAV_COUNTS_QUERY_KEY } from "@/lib/nav-counts";

const BADGE_REFETCH_MS = 120_000;

type SidebarBadgesContextValue = {
  badges: SidebarNavBadgeMap;
  childTabBadges: SidebarNavBadgeMap;
};

const SidebarBadgesContext = createContext<SidebarBadgesContextValue | null>(null);

function resolveBadgeBranchScope(
  role: string | undefined,
  activeBranchId: number | null,
  userBranchId: number | null | undefined,
) {
  if (role === "SUPER_ADMIN") {
    return {
      queryBranchId: activeBranchId,
    };
  }

  const effectiveBranchId = activeBranchId ?? userBranchId ?? null;
  return {
    queryBranchId: effectiveBranchId,
  };
}

function toNavCountsSnapshot(data: NavCountsSnapshot & { branchId?: number | null }): NavCountsSnapshot {
  return {
    lowStock: data.lowStock,
    expiringBatches: data.expiringBatches,
    pendingTransfers: data.pendingTransfers,
    kdsOrders: data.kdsOrders,
    pendingPurchaseOrders: data.pendingPurchaseOrders,
    pendingSettlements: data.pendingSettlements,
    pendingLeave: data.pendingLeave,
  };
}

export function SidebarBadgesProvider({ children }: { children: ReactNode }) {
  const { user, activeBranchId, isInitialized } = useAuth();
  const role = user?.role;
  const enabled = !!user && isInitialized;
  const { queryBranchId } = resolveBadgeBranchScope(
    role,
    activeBranchId,
    user?.branchId,
  );

  const { data: navCounts } = useQuery({
    queryKey: [NAV_COUNTS_QUERY_KEY, queryBranchId ?? "all", role],
    queryFn: () =>
      fetchAPI(API_ENDPOINTS.navCounts(queryBranchId ?? undefined)) as Promise<
        NavCountsSnapshot & { branchId: number | null }
      >,
    enabled,
    staleTime: 60_000,
    refetchInterval: BADGE_REFETCH_MS,
    refetchOnWindowFocus: false,
  });

  const { badges, childTabBadges } = useMemo(() => {
    if (!navCounts) {
      return { badges: {} as SidebarNavBadgeMap, childTabBadges: {} as SidebarNavBadgeMap };
    }
    return buildSidebarBadgesFromNavCounts(
      toNavCountsSnapshot(navCounts),
      role,
      queryBranchId,
    );
  }, [navCounts, role, queryBranchId]);

  const value = useMemo(
    () => ({ badges, childTabBadges }),
    [badges, childTabBadges],
  );

  return <SidebarBadgesContext.Provider value={value}>{children}</SidebarBadgesContext.Provider>;
}

export function useSidebarNavBadges() {
  const context = useContext(SidebarBadgesContext);
  if (!context) {
    throw new Error("useSidebarNavBadges must be used within SidebarBadgesProvider");
  }
  return context;
}
