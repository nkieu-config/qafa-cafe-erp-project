import type { Role } from "@/types/api";
import { SIDEBAR_GROUPS, isSidebarItemActive } from "@/lib/navigation";

const STORAGE_KEY = "sidebar-expanded-groups";

export const SIDEBAR_GROUP_NAMES = [
  "Overview & Analytics",
  "Store Operations",
  "Back Office",
  "System Admin",
] as const;

export type SidebarGroupName = (typeof SIDEBAR_GROUP_NAMES)[number];

export function getDefaultExpandedGroups(role?: Role): Record<SidebarGroupName, boolean> {
  const defaults: Record<SidebarGroupName, boolean> = {
    "Overview & Analytics": true,
    "Store Operations": true,
    "Back Office": false,
    "System Admin": false,
  };

  if (role === "SUPER_ADMIN") {
    defaults["Back Office"] = true;
    defaults["System Admin"] = true;
  } else if (role === "MANAGER") {
    defaults["Back Office"] = true;
  }

  return defaults;
}

export function readStoredExpandedGroups(): Partial<Record<SidebarGroupName, boolean>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<Record<SidebarGroupName, boolean>>;
  } catch {
    return null;
  }
}

export function writeStoredExpandedGroups(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function resolveInitialExpandedGroups(role?: Role): Record<string, boolean> {
  const defaults = getDefaultExpandedGroups(role);
  const stored = readStoredExpandedGroups();
  if (!stored) return { ...defaults };

  const merged = { ...defaults };
  for (const name of SIDEBAR_GROUP_NAMES) {
    if (typeof stored[name] === "boolean") {
      merged[name] = stored[name];
    }
  }
  return merged;
}

/** Expand sidebar groups that contain the active route (pure, testable). */
export function mergeExpandedGroupsForActivePath(
  prev: Record<string, boolean>,
  pathname: string,
): Record<string, boolean> {
  let next = prev;
  for (const group of SIDEBAR_GROUPS) {
    const hasActiveItem = group.items.some((item) => isSidebarItemActive(item, pathname));
    if (hasActiveItem && !prev[group.group]) {
      if (next === prev) next = { ...prev };
      next[group.group] = true;
    }
  }
  return next;
}
