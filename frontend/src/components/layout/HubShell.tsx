"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { AnimatedPage } from "@/components/animated-page";
import { AntdScope } from "@/components/providers/AntdScope";
import { useAuth } from "@/context/AuthContext";
import {
  getHubConfig,
  getVisibleHubTabs,
  isTabActive,
  type HubId,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type HubShellProps = {
  hubId: HubId;
  children: React.ReactNode;
  wrapAntd?: boolean;
  contentClassName?: string;
};

export function HubShell({
  hubId,
  children,
  wrapAntd,
  contentClassName = "relative flex-1 min-h-0 w-full overflow-y-auto pb-10",
}: HubShellProps) {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const hub = getHubConfig(hubId);
  const role = user?.role ?? "";
  const tabs = getVisibleHubTabs(hubId, role);
  const shouldWrapAntd = wrapAntd ?? hub.wrapAntd ?? true;
  const HubIcon = hub.icon;

  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;

    const activeTab = container.querySelector<HTMLElement>('[data-active="true"]');
    activeTab?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname, tabs.length, prefersReducedMotion]);

  const content = (
    <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance flex items-center gap-2">
            <HubIcon className={hub.iconClassName} aria-hidden />
            {hub.label}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{hub.description}</p>
        </div>
      </div>

      {tabs.length > 0 && (
        <div className="relative shrink-0 w-fit max-w-full">
          <div
            ref={tabsRef}
            role="tablist"
            aria-label={`${hub.label} sections`}
            className="inline-flex max-w-full space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto scrollbar-thin scroll-smooth snap-x snap-mandatory"
          >
            {tabs.map((tab) => {
              const isActive = isTabActive(pathname, tab.path, hub.basePath);
              const TabIcon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  role="tab"
                  aria-selected={isActive}
                  data-active={isActive ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg transition-opacity duration-150 whitespace-nowrap snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 motion-reduce:transition-none",
                    isActive
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                >
                  <TabIcon className="w-4 h-4 shrink-0" aria-hidden />
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent lg:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent lg:hidden"
            aria-hidden
          />
        </div>
      )}

      <div className={contentClassName}>{children}</div>
    </AnimatedPage>
  );

  if (shouldWrapAntd) {
    return <AntdScope>{content}</AntdScope>;
  }

  return content;
}
