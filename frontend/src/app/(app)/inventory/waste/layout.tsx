"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { AccessDeniedState } from "@/components/shared/access-denied-state";

export default function WasteLogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "MANAGER"]}
      fallback={
        <AccessDeniedState description="Manager or Super Admin access is required to record and view waste logs." />
      }
    >
      {children}
    </RoleGuard>
  );
}
