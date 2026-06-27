"use client"

import { HubPageHeader } from "@/components/shared/hub-card"
import { BranchEmptyState } from "@/components/shared/branch-empty-state"
import { useAuth } from "@/context/AuthContext"
import { useExpectedCash } from '@/hooks/domains/useFinanceQueries';
import { SettlementForm } from "@/components/pos/SettlementForm"
import { ExpenseForm } from "@/components/pos/ExpenseForm"

export default function SettlementPage() {
  const { activeBranchId } = useAuth()
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  
  const { data: expected } = useExpectedCash(branchIdNum);

  if (!branchIdNum) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to reconcile end-of-day settlement." />
    );
  }

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="End of Day Settlement"
        description="Reconcile all payment channels and submit to HQ."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettlementForm branchIdNum={branchIdNum} expected={expected} />
        <ExpenseForm branchIdNum={branchIdNum} />
      </div>
    </div>
  )
}
