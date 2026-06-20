"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !token && pathname !== '/login') {
      router.push('/login');
    }
  }, [isInitialized, token, pathname, router]);

  if (!isInitialized) {
    return <div className="h-screen w-full flex items-center justify-center text-slate-500">Loading…</div>;
  }

  if (!token && pathname !== '/login') {
    return <div className="h-screen w-full flex items-center justify-center text-slate-500">Redirecting to login…</div>;
  }

  return <>{children}</>;
}
