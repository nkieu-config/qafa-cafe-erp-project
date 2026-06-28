"use client";

import { Landmark } from "lucide-react";
import { HubPageHeader } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
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
    : null;

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="End of Day Settlement"
        description="Reconcile all payment channels and submit to HQ."
        hideTitle
        actions={
          canViewFinance ? (
            <ButtonLink variant="outline" href="/finance/overview">
              <Landmark className="w-4 h-4 mr-2" aria-hidden />
              Finance Overview
            </ButtonLink>
          ) : undefined
        }
      />

      {expectedErrorMessage && (
        <QueryErrorBanner
          message={expectedErrorMessage}
          onRetry={() => void refetchExpected()}
          loading={expectedFetching}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettlementForm
          branchIdNum={branchIdNum}
          expected={expected}
          expectedLoading={expectedLoading}
          expectedUnavailable={expectedError || expectedLoading}
          canViewFinance={canViewFinance}
        />
        <ExpenseForm branchIdNum={branchIdNum} />
      </div>
    </div>
  );
}
