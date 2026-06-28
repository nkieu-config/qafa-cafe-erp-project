"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, settlementStatusTone } from "@/components/shared/status-badge";
import { exportSales } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  DollarSign,
  Download,
  Loader2,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  useApproveSettlement,
  useFinanceExpenses,
  useFinanceSettlements,
} from "@/hooks/domains/useFinanceQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/errors";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import { formatDate, formatDateTime } from "@/lib/intl-date";
import { formatBaht } from "@/lib/money";
import type { Branch, Expense, Settlement } from "@/types/api";
import {
  type SettlementStatusFilter,
  filterExpenses,
  filterSettlements,
  settlementStatusLabel,
  summarizeFinanceOverview,
} from "@/lib/finance-overview-filters";
import {
  buildFinanceOverviewUrl,
  parseFinanceOverviewSearchParams,
} from "@/lib/finance-hub-url";
import {
  financeExpenseAmountClassName,
  financeHubIconClassName,
  financeMetricIconClassName,
  financeSectionPanelClassName,
  financeSectionTitleClassName,
  hubCtaClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  inlineLinkClassName,
  nativeTableBodyClassName,
  nativeTableCellMutedClassName,
  nativeTableCellPrimaryClassName,
  nativeTableClassName,
  nativeTableEmptyCellClassName,
  nativeTableHeadClassName,
  nativeTableRowClassName,
  settlementDifferenceClassName,
  tableActionAccentClassName,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function FinanceTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function FinanceDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, activeBranchId } = useAuth();
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;
  const showAllBranches = !branchIdNum;

  const initialStatus = parseFinanceOverviewSearchParams(searchParams).statusFilter;

  const [settlementFilter, setSettlementFilter] = useState<SettlementStatusFilter>(initialStatus);
  const [expenseSearch, setExpenseSearch] = useState("");
  const debouncedExpenseSearch = useDebouncedValue(expenseSearch.trim().toLowerCase(), 300);
  const [approveTarget, setApproveTarget] = useState<Settlement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setSettlementFilter(parseFinanceOverviewSearchParams(searchParams).statusFilter);
  }, [searchParams]);

  const {
    data: settlements = [],
    isLoading: loadingSettlements,
    isError: settlementsError,
    error: settlementsErr,
    refetch: refetchSettlements,
    isFetching: fetchingSettlements,
  } = useFinanceSettlements(branchIdNum);
  const {
    data: expenses = [],
    isLoading: loadingExpenses,
    isError: expensesError,
    error: expensesErr,
    refetch: refetchExpenses,
    isFetching: fetchingExpenses,
  } = useFinanceExpenses(branchIdNum);
  const approveSettlementMutation = useApproveSettlement();

  const hasError = settlementsError || expensesError;
  const isLoading = loadingSettlements || loadingExpenses;
  const isFetching = fetchingSettlements || fetchingExpenses;
  const errorMessage = getErrorMessage(
    settlementsErr ?? expensesErr,
    "Failed to load finance data",
  );

  const summary = useMemo(
    () => summarizeFinanceOverview(settlements, expenses),
    [settlements, expenses],
  );

  const visibleSettlements = useMemo(
    () => filterSettlements(settlements, settlementFilter),
    [settlements, settlementFilter],
  );

  const visibleExpenses = useMemo(
    () => filterExpenses(expenses, debouncedExpenseSearch),
    [expenses, debouncedExpenseSearch],
  );

  const hasActiveFilters =
    settlementFilter !== "ALL" || expenseSearch.trim().length > 0;

  const setSettlementFilterAndUrl = useCallback(
    (next: SettlementStatusFilter) => {
      setSettlementFilter(next);
      router.replace(
        buildFinanceOverviewUrl(next === "ALL" ? undefined : { status: next }),
        { scroll: false },
      );
    },
    [router],
  );

  const handleApprove = async (id: number) => {
    try {
      await approveSettlementMutation.mutateAsync(id);
      toast.success("Settlement approved");
      setApproveTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve settlement"));
    }
  };

  const handleExport = async () => {
    if (!isAuthenticated) return;
    try {
      setIsExporting(true);
      toast.info("Exporting sales…");
      await exportSales(activeBranchId || undefined);
      toast.success("Export successful");
    } catch (error) {
      toast.error(getErrorMessage(error, "Export failed"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRetry = () => {
    void refetchSettlements();
    void refetchExpenses();
  };

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        icon={Wallet}
        accentHub="finance"
        actions={
          <Button
            onClick={() => void handleExport()}
            disabled={isExporting}
            className={hubCtaClassName("finance", "font-bold")}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
                Exporting…
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" aria-hidden />
                Export sales (CSV)
              </>
            )}
          </Button>
        }
      />

      <HubListPage className={financeSectionPanelClassName()}>
        {initialStatus === "PENDING" && summary.pending > 0 && (
          <HubListPage.Banner>
            <div className={infoBannerClassName()}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={infoBannerIconClassName()} aria-hidden />
                <div>
                  <p className={infoBannerTitleClassName()}>Settlements awaiting approval</p>
                  <p className={infoBannerTextClassName()}>
                    {summary.pending} settlement{summary.pending === 1 ? "" : "s"}{" "}
                    {summary.pending === 1 ? "needs" : "need"} cash reconciliation review
                    {showAllBranches ? " across branches" : ` at ${branchName ?? "this branch"}`}.
                  </p>
                </div>
              </div>
            </div>
          </HubListPage.Banner>
        )}

        <HubListPage.Error
          message={hasError ? errorMessage : undefined}
          onRetry={handleRetry}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          branchName={branchName}
          allBranches={showAllBranches}
          search={expenseSearch}
          onSearchChange={setExpenseSearch}
          searchPlaceholder="Search expenses…"
          showReset={hasActiveFilters}
          onReset={() => {
            setSettlementFilterAndUrl("ALL");
            setExpenseSearch("");
          }}
          filters={
            <ListFilterSelect
              value={settlementFilter}
              onValueChange={(value) =>
                setSettlementFilterAndUrl(value as SettlementStatusFilter)
              }
              ariaLabel="Filter settlements by status"
              widthClassName="w-full sm:w-[180px]"
              options={[
                { value: "ALL", label: "All settlements" },
                { value: "PENDING", label: "Pending approval" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={hasError}
          isFetching={isFetching}
          actions={
            <Link
              href="/finance/ledger"
              className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden />
              General ledger
            </Link>
          }
        >
          {formatHubListCountWithFetching(
            (() => {
              const base = hasActiveFilters
                ? `${visibleSettlements.length} of ${settlements.length} settlements · ${visibleExpenses.length} of ${expenses.length} expenses`
                : summary.settlements > 0 || summary.expenses > 0
                  ? `${summary.settlements} settlement${summary.settlements === 1 ? "" : "s"} · ${summary.expenses} expense${summary.expenses === 1 ? "" : "s"}`
                  : "No finance activity yet";
              return summary.totalExpenseAmount > 0 && !hasActiveFilters
                ? `${base} · -${formatBaht(summary.totalExpenseAmount)} expenses`
                : base;
            })(),
            isFetching,
            isLoading,
          )}
        </HubListPage.Count>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={financeSectionPanelClassName("flex flex-col border border-[var(--table-container-border)] bg-[var(--table-container-bg)]")}>
            <h2 className={financeSectionTitleClassName("mb-4")}>
              <CheckCircle2 className={financeHubIconClassName()} aria-hidden />
              Shift settlements
            </h2>
            <div className="overflow-x-auto">
              {loadingSettlements ? (
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
                      <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={nativeTableBodyClassName()}>
                    {visibleSettlements.map((settlement) => (
                      <tr key={settlement.id} className={nativeTableRowClassName()}>
                        <td className={nativeTableCellMutedClassName()}>
                          {formatDate(settlement.date)}
                        </td>
                        <td className={nativeTableCellPrimaryClassName()}>
                          {settlement.branch?.name ?? "Main"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatBaht(settlement.expectedCash)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatBaht(settlement.actualCash)}
                        </td>
                        <td className={settlementDifferenceClassName(settlement.difference)}>
                          {settlement.difference === 0
                            ? formatBaht(0)
                            : `${settlement.difference > 0 ? "+" : "-"}${formatBaht(Math.abs(settlement.difference))}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge tone={settlementStatusTone(settlement.status)}>
                            {settlementStatusLabel(settlement.status)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {settlement.status === "PENDING" && (
                            <TableActionButton
                              icon={CheckCircle2}
                              label={`Approve settlement for ${settlement.branch?.name ?? "branch"} on ${formatDate(settlement.date)}`}
                              iconOnly
                              onClick={() => setApproveTarget(settlement)}
                              className={tableActionAccentClassName("emerald")}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleSettlements.length === 0 && !loadingSettlements && (
                      <tr>
                        <td colSpan={7} className={nativeTableEmptyCellClassName()}>
                          {settlementFilter !== "ALL"
                            ? "No settlements match the current filter."
                            : "No shift settlements recorded yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={financeSectionPanelClassName("flex flex-col border border-[var(--table-container-border)] bg-[var(--table-container-bg)]")}>
            <h2 className={financeSectionTitleClassName()}>
              <DollarSign className={financeMetricIconClassName("amber")} aria-hidden />
              Petty cash expenses
            </h2>
            <div className="overflow-x-auto">
              {loadingExpenses ? (
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
                    {visibleExpenses.map((expense) => (
                      <tr key={expense.id} className={nativeTableRowClassName()}>
                        <td className={nativeTableCellMutedClassName()}>
                          {formatDateTime(expense.createdAt)}
                        </td>
                        <td className={nativeTableCellPrimaryClassName()}>{expense.category}</td>
                        <td className={nativeTableCellMutedClassName()}>
                          {expense.description?.trim() || "—"}
                        </td>
                        <td className={financeExpenseAmountClassName()}>
                          -{formatBaht(expense.amount)}
                        </td>
                        <td className={nativeTableCellMutedClassName()}>
                          {expense.recordedBy?.name ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {visibleExpenses.length === 0 && !loadingExpenses && (
                      <tr>
                        <td colSpan={5} className={nativeTableEmptyCellClassName()}>
                          {expenseSearch.trim()
                            ? "No expenses match your search."
                            : "No petty cash expenses recorded."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </HubListPage>

      <ConfirmDialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
        title="Approve this settlement?"
        description={
          approveTarget
            ? `${approveTarget.branch?.name ?? "Branch"} · ${formatDate(approveTarget.date)} · expected ${formatBaht(approveTarget.expectedCash)}, actual ${formatBaht(approveTarget.actualCash)}, diff ${approveTarget.difference >= 0 ? "+" : "-"}${formatBaht(Math.abs(approveTarget.difference))}.`
            : undefined
        }
        confirmLabel="Approve settlement"
        loading={approveSettlementMutation.isPending}
        onConfirm={() => {
          if (approveTarget) return handleApprove(approveTarget.id);
        }}
      />
    </div>
  );
}
