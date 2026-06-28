"use client";

import { KdsImmersiveNav } from "@/components/kds/KdsImmersiveChrome";

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col flex-1 min-h-0 w-full h-full">
      <div className="flex-1 min-h-0 min-w-0">{children}</div>
      <KdsImmersiveNav />
    </div>
  );
}
