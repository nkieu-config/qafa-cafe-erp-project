import { findHubByPathname } from "@/lib/navigation";

/** Routes that use a compact icon rail instead of the full sidebar on desktop. */
export function isImmersiveRoute(pathname: string) {
  return (
    pathname.startsWith("/pos/terminal") ||
    pathname.startsWith("/pos/settlement") ||
    pathname === "/kds"
  );
}

/** POS terminal/settlement — mobile uses POS tab bar instead of global bottom nav. */
export function isPosImmersiveRoute(pathname: string) {
  return (
    pathname.startsWith("/pos/terminal") ||
    pathname.startsWith("/pos/settlement")
  );
}

/** KDS — mobile uses operational quick nav instead of global bottom nav. */
export function isKdsImmersiveRoute(pathname: string) {
  return pathname === "/kds" || pathname.startsWith("/kds/");
}

/** Shared bottom padding for POS/KDS immersive mobile nav bars. */
export function isOperationalImmersiveRoute(pathname: string) {
  return isPosImmersiveRoute(pathname) || isKdsImmersiveRoute(pathname);
}

/** Hub layout pages (HubShell) — used for compact topbar rhythm on desktop. */
export function isShellHubPage(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return false;
  return findHubByPathname(pathname) != null;
}
