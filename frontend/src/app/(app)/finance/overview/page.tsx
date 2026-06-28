"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { HubPageHeader } from "@/components/shared/hub-card"
import { ListToolbar } from "@/components/shared/list-toolbar"
import { QueryErrorBanner } from "@/components/shared/query-error-banner"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge, settlementStatusTone } from "@/components/shared/status-badge"
import { exportSales } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CheckCircle2, DollarSign, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { useFinanceSettlements, useFinanceExpenses, useApproveSettlement } from '@/hooks/domains/useFinanceQueries';
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { getErrorMessage } from "@/lib/errors"
import { formatDate, formatDateTime } from "@/lib/intl-date"
import { Settlement, Expense, Branch } from "@/types"
import {
  financeApproveButtonClassName,
  financeExpenseAmountClassName,
  financeHubIconClassName,
  financeMetricIconClassName,
  financePrimaryActionClassName,
  financeSectionPanelClassName,
  financeSectionTitleClassName,
  nativeTableBodyClassName,
  nativeTableCellMutedClassName,
  nativeTableCellPrimaryClassName,
  nativeTableClassName,
  nativeTableEmptyCellClassName,
  nativeTableHeadClassName,
  nativeTableRowClassName,
  settlementDifferenceClassName,
  text,
} from "@/lib/theme"

function FinanceTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default function FinanceDashboardPage() {
  const { isAuthenticated, activeBranchId } = useAuth()
  const searchParams = useSearchParams()
  const pendingFromUrl = searchParams.get("status") === "PENDING"
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;
  const showAllBranches = !branchIdNum;
  const [approveTarget, setApproveTarget] = useState<Settlement | null>(null)
  const [settlementFilter, setSettlementFilter] = useState<"ALL" | "PENDING">(
    pendingFromUrl ? "PENDING" : "ALL",
  )

  useEffect(() => {
    if (searchParams.get("status") === "PENDING") setSettlementFilter("PENDING")
  }, [searchParams])
  
  const {
    data: settlements = [],
    isLoading: loadingSettlements,
    isError: settlementsError,
    error: settlementsErr,
    refetch: refetchSettlements,
  } = useFinanceSettlements(branchIdNum)
  const {
    data: expenses = [],
    isLoading: loadingExpenses,
    isError: expensesError,
    error: expensesErr,
    refetch: refetchExpenses,
  } = useFinanceExpenses(branchIdNum)
  const approveSettlementMutation = useApproveSettlement()

  const isLoading = loadingSettlements || loadingExpenses
  const hasError = settlementsError || expensesError
  const errorMessage = getErrorMessage(
    settlementsErr ?? expensesErr,
    "Failed to load finance data",
  )

  const handleApprove = async (id: number) => {
    try {
      await approveSettlementMutation.mutateAsync(id)
      toast.success("Approved successfully")
      setApproveTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve"))
    }
  }

  const handleExport = async () => {
    if (!isAuthenticated) return
    try {
      toast.info("Exporting sales…")
      await exportSales(activeBranchId || undefined)
      toast.success("Export successful!")
    } catch (error) {
      toast.error(getErrorMessage(error, "Export failed"))
    }
  }

  const handleRetry = () => {
    void refetchSettlements()
    void refetchExpenses()
  }

  const visibleSettlements = useMemo(() => {
    if (settlementFilter !== "PENDING") return settlements
    return settlements.filter((s: Settlement) => s.status === "PENDING")
  }, [settlements, settlementFilter])

  const pendingCount = settlements.filter((s: Settlement) => s.status === "PENDING").length

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        description="Review end-of-day settlements and petty cash expenses."
        actions={
          <Button onClick={handleExport} className={financePrimaryActionClassName()}>
            <Download className="w-4 h-4 mr-2" />
            Export Sales (CSV)
          </Button>
        }
      />

      {hasError && (
        <QueryErrorBanner message={errorMessage} onRetry={handleRetry} />
      )}

      <ListToolbar
        branchName={branchName}
        allBranches={showAllBranches}
        filters={
          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value as "ALL" | "PENDING")}
            className="min-h-[44px] rounded-md border px-3 text-sm border-[var(--border)] bg-[var(--table-container-bg)] text-[var(--foreground)]"
            aria-label="Filter settlements by status"
          >
            <option value="ALL">All settlements</option>
            <option value="PENDING">Pending approval</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={financeSectionPanelClassName("flex flex-col")}>
          <div className="mb-4">
            <h2 className={financeSectionTitleClassName("mb-0")}>
              <CheckCircle2 className={financeHubIconClassName()} />
              Shift Settlements
              {pendingCount > 0 && (
                <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                  ({pendingCount} pending)
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <FinanceTableSkeleton />
            ) : (
              <table className={nativeTableClassName()}>
                <thead className={nativeTableHeadClassName()}>
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3 text-right">Actual</th>
                    <th className="px-4 py-3 text-right">Diff</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className={nativeTableBodyClassName()}>
                  {visibleSettlements.map((s: Settlement) => (
                    <tr key={s.id} className={nativeTableRowClassName()}>
                      <td className={nativeTableCellMutedClassName()}>{formatDate(s.date)}</td>
                      <td className={nativeTableCellPrimaryClassName()}>{s.branch?.name || 'Main'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">฿{s.expectedCash.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">฿{s.actualCash.toLocaleString()}</td>
                      <td className={settlementDifferenceClassName(s.difference)}>
                        {s.difference > 0 ? '+' : ''}{s.difference.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge tone={settlementStatusTone(s.status)}>{s.status}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.status === 'PENDING' && (
                          <Button size="sm" variant="ghost" className={financeApproveButtonClassName()} onClick={() => setApproveTarget(s)}>
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visibleSettlements.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className={nativeTableEmptyCellClassName()}>
                        {settlementFilter === "PENDING"
                          ? "No pending settlements."
                          : "No settlements found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={financeSectionPanelClassName("flex flex-col")}>
          <h2 className={financeSectionTitleClassName()}>
            <DollarSign className={financeMetricIconClassName("amber")} />
            Petty Cash Expenses
          </h2>
          <div className="overflow-x-auto">
            {isLoading ? (
              <FinanceTableSkeleton />
            ) : (
              <table className={nativeTableClassName()}>
                <thead className={nativeTableHeadClassName()}>
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 rounded-r-lg">By</th>
                  </tr>
                </thead>
                <tbody className={nativeTableBodyClassName()}>
                  {expenses.map((e: Expense) => (
                    <tr key={e.id} className={nativeTableRowClassName()}>
                      <td className={nativeTableCellMutedClassName()}>{formatDateTime(e.createdAt)}</td>
                      <td className={nativeTableCellPrimaryClassName()}>{e.category}</td>
                      <td className={nativeTableCellMutedClassName()}>{e.description || '-'}</td>
                      <td className={financeExpenseAmountClassName()}>-฿{e.amount.toLocaleString()}</td>
                      <td className={nativeTableCellMutedClassName()}>{e.recordedBy?.name}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className={nativeTableEmptyCellClassName()}>No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null)
        }}
        title="Approve settlement?"
        description={
          approveTarget
            ? `Confirm cash reconciliation for ${approveTarget.branch?.name ?? "branch"} on ${formatDate(approveTarget.date)}. Expected ฿${approveTarget.expectedCash.toLocaleString()}, actual ฿${approveTarget.actualCash.toLocaleString()}.`
            : undefined
        }
        confirmLabel="Approve Settlement"
        loading={approveSettlementMutation.isPending}
        onConfirm={() => {
          if (approveTarget) return handleApprove(approveTarget.id)
        }}
      />
    </div>
  )
}
