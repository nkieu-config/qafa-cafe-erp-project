"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { HubShell } from "@/components/layout/HubShell";
import { AccessDeniedState } from "@/components/shared/access-denied-state";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "MANAGER"]}
      fallback={
        <AccessDeniedState description="Manager or Super Admin access is required for finance operations." />
      }
    >
      <HubShell hubId="finance">{children}</HubShell>
    </RoleGuard>
  );
}
