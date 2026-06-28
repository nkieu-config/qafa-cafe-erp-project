"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { AntdScope } from "@/components/providers/AntdScope";
import { AccessDeniedState } from "@/components/shared/access-denied-state";

export default function PosOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "MANAGER"]}
      fallback={
        <AccessDeniedState description="Manager or Super Admin access is required to view order history." />
      }
    >
      <AntdScope>{children}</AntdScope>
    </RoleGuard>
  );
}
