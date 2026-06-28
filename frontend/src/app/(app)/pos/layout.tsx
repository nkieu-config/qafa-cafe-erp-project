"use client";

import { usePathname } from "next/navigation";
import { HubShell } from "@/components/layout/HubShell";

const POS_IMMERSIVE_PATHS = ["/pos/terminal", "/pos/settlement"];

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = POS_IMMERSIVE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (immersive) {
    return (
      <div className="relative flex flex-col flex-1 min-h-0 w-full h-full">
        {children}
      </div>
    );
  }

  return (
    <HubShell hubId="pos" contentClassName="relative flex-1 min-h-0 w-full">
      {children}
    </HubShell>
  );
}
