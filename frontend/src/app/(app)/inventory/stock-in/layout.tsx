"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { AccessDeniedState } from "@/components/shared/access-denied-state";

export default function StockInLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "MANAGER"]}
      fallback={
        <AccessDeniedState description="Manager or Super Admin access is required to receive stock (GRN)." />
      }
    >
      {children}
    </RoleGuard>
  );
}
