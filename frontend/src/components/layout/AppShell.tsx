"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SocketProvider } from "@/context/SocketContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <Sidebar />
      <main className="flex-1 h-screen relative z-10 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </SocketProvider>
  );
}
