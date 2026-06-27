"use client";

import { AntdProvider } from "@/providers/AntdProvider";

export function AntdScope({ children }: { children: React.ReactNode }) {
  return <AntdProvider>{children}</AntdProvider>;
}
