import { PATH_LABELS } from "./path-labels";
import { findHubByPathname, findActiveTabForPathname } from "./hub-utils";
import { findActiveSidebarItem } from "./sidebar";
import type { BreadcrumbItem, HubConfig } from "./types";

export function resolvePathLabel(segment: string): string {
  return PATH_LABELS[segment] ?? segment.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

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
