"use client";

import { Landmark } from "lucide-react";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubListPage } from "@/components/shared/hub-list-page";
import { useAuth } from "@/context/AuthContext";
import { useExpectedCash } from "@/hooks/domains/useFinanceQueries";
import { SettlementForm } from "@/components/pos/SettlementForm";
import { ExpenseForm } from "@/components/pos/ExpenseForm";
import { ButtonLink } from "@/components/ui/button-link";
import { getErrorMessage } from "@/lib/errors";

export default function SettlementPage() {
  const { user, activeBranchId } = useAuth();
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const canViewFinance = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const {
    data: expected,
    isLoading: expectedLoading,
    isError: expectedError,
    error: expectedErr,
    refetch: refetchExpected,
    isFetching: expectedFetching,
  } = useExpectedCash(branchIdNum);

  if (!branchIdNum) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to reconcile end-of-day settlement." />
    );
  }

  const expectedErrorMessage = expectedError
    ? getErrorMessage(expectedErr, "Failed to load expected cash totals")
    : undefined;

  return (
    <div className="space-y-6">
      {canViewFinance && (
        <div className="flex justify-end">
          <ButtonLink variant="outline" href="/finance/overview">
            <Landmark className="w-4 h-4 mr-2" aria-hidden />
            Finance Overview
          </ButtonLink>
        </div>
      )}

      <HubListPage.Error
        message={expectedErrorMessage}
        onRetry={() => void refetchExpected()}
        loading={expectedFetching}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettlementForm
          branchIdNum={branchIdNum}
          expected={expected}
          expectedLoading={expectedLoading}
          expectedError={expectedError}
          canViewFinance={canViewFinance}
        />
        <ExpenseForm branchIdNum={branchIdNum} />
      </div>
    </div>
  );
}
