"use client"

import { HubPageHeader } from "@/components/shared/hub-card"
import { exportSales } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CheckCircle2, DollarSign, Download, RefreshCw } from "lucide-react"
import { Skeleton } from "antd"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { useFinanceSettlements, useFinanceExpenses, useApproveSettlement } from '@/hooks/domains/useFinanceQueries';
import { getErrorMessage } from "@/lib/errors"
import { Settlement, Expense } from "@/types"

function FinanceTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} active paragraph={{ rows: 0 }} title={{ width: "100%" }} />
      ))}
    </div>
  )
}

export default function FinanceDashboardPage() {
  const { isAuthenticated, activeBranchId } = useAuth()
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve"))
    }
  }

  const handleExport = async () => {
    if (!isAuthenticated) return
    try {
      toast.info("Exporting sales...")
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

  return (
    <div className="space-y-6">
      <HubPageHeader
        title="Finance & Settlement"
        description={
          branchIdNum
            ? "Review end-of-day settlements and petty cash expenses for the selected branch."
            : "Showing all branches. Select a branch in the top bar to filter."
        }
        actions={
          <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-none">
            <Download className="w-4 h-4 mr-2" />
            Export Sales (CSV)
          </Button>
        }
      />

      {hasError && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{errorMessage}</p>
          <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Shift Settlements
          </h2>
          <div className="overflow-x-auto">
            {isLoading ? (
              <FinanceTableSkeleton />
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {settlements.map((s: Settlement) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.branch?.name || 'Main'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">฿{s.expectedCash.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">฿{s.actualCash.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${s.difference < 0 ? 'text-red-500' : s.difference > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {s.difference > 0 ? '+' : ''}{s.difference.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.status === 'PENDING' && (
                          <Button size="sm" variant="ghost" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(s.id)}>
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {settlements.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">No settlements found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Petty Cash Expenses
          </h2>
          <div className="overflow-x-auto">
            {isLoading ? (
              <FinanceTableSkeleton />
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 rounded-r-lg">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map((e: Expense) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(e.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{e.category}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.description || '-'}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-medium tabular-nums">-฿{e.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.recordedBy?.name}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
