"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarRail } from "@/components/layout/SidebarRail";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Topbar } from "@/components/layout/Topbar";
import { SocketProvider } from "@/context/SocketContext";
import { MobileNavProvider, useMobileNav } from "@/context/MobileNavContext";
import { SidebarBadgesProvider } from "@/context/SidebarBadgesContext";
import { SidebarPreferencesProvider } from "@/context/SidebarPreferencesContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isImmersiveRoute, isOperationalImmersiveRoute } from "@/lib/shell-routes";
import { cn } from "@/lib/utils";
import { mainContentWithMobileNavClassName, mainContentWithPosImmersiveNavClassName, shell, shellContentFrameClassName, shellContentPaddingYClassName, skipLinkClassName } from "@/lib/theme";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const { open, setOpen, close } = useMobileNav();
  const immersive = isImmersiveRoute(pathname);
  const operationalImmersive = isOperationalImmersiveRoute(pathname);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const useRail = immersive && !sidebarExpanded;
  const showMobileBottomNav = !immersive;
  const mobileContentPadding = showMobileBottomNav
    ? mainContentWithMobileNavClassName()
    : operationalImmersive
      ? mainContentWithPosImmersiveNavClassName()
      : undefined;

  useEffect(() => {
    close();
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, close]);

  useEffect(() => {
    if (!immersive) {
      setSidebarExpanded(false);
    }
  }, [immersive]);

  return (
    <div className={cn("flex h-dvh w-full overflow-hidden", shell.bg)}>
      <a href="#main-content" className={skipLinkClassName()}>
        Skip to main content
      </a>

      <aside
        className={cn(
          "hidden lg:block shrink-0 overflow-hidden",
          "transition-[width] duration-200 motion-reduce:transition-none",
          useRail ? "w-16" : "w-64",
        )}
        aria-label="Application sidebar"
      >
        {useRail ? (
          <SidebarRail onExpand={() => setSidebarExpanded(true)} />
        ) : (
          <Sidebar
            onCollapse={immersive ? () => setSidebarExpanded(false) : undefined}
          />
        )}
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={cn("w-[min(100vw,16rem)] max-w-[16rem] p-0 gap-0 border-r border-border", shell.sidebarBorder)}
          showCloseButton
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar
            onNavigate={close}
            className="h-full w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 min-w-0 h-full relative z-10 flex flex-col overflow-hidden outline-none"
      >
        <Topbar />
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            mobileContentPadding,
          )}
        >
          {immersive ? (
            <div className="p-2 sm:p-4 lg:p-8">{children}</div>
          ) : (
            <div className={cn(shellContentFrameClassName(), shellContentPaddingYClassName())}>
              {children}
            </div>
          )}
        </div>
      </main>

      {showMobileBottomNav && <MobileBottomNav />}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <MobileNavProvider>
        <SidebarPreferencesProvider>
          <SidebarBadgesProvider>
            <AppShellInner>{children}</AppShellInner>
          </SidebarBadgesProvider>
        </SidebarPreferencesProvider>
      </MobileNavProvider>
    </SocketProvider>
  );
}
