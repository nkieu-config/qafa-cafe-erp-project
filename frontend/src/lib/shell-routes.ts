import { findHubByPathname } from "@/lib/navigation";

/** Routes that use a compact icon rail instead of the full sidebar on desktop. */
export function isImmersiveRoute(pathname: string) {
  return (
    pathname.startsWith("/pos/terminal") ||
    pathname.startsWith("/pos/settlement") ||
    pathname === "/kds"
  );
}

/** Hub layout pages (HubShell) — used for compact topbar rhythm on desktop. */
export function isShellHubPage(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return false;
  return findHubByPathname(pathname) != null;
}
