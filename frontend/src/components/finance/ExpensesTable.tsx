"use client";

import { DollarSign } from "lucide-react";
import { FinanceTableSkeleton } from "@/components/finance/FinanceTableSkeleton";
import { formatDateTime } from "@/lib/intl-date";
import { formatBaht } from "@/lib/money";
import {
  listMobileCardClassName,
  nativeTableBodyClassName,
  nativeTableCellMutedClassName,
  nativeTableCellPrimaryClassName,
  nativeTableClassName,
  nativeTableEmptyCellClassName,
  nativeTableHeadClassName,
  nativeTableRowClassName,
} from "@/lib/theme/data-table";
import { financeExpenseAmountClassName, financeMetricIconClassName, financeSectionPanelClassName, financeSectionTitleClassName } from "@/lib/theme/finance";
import { text } from "@/lib/theme/surface";
import { typeMicroClassName, typeUiLabelClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/api";

type ExpensesTableProps = {
  expenses: Expense[];
  loading: boolean;
  expenseSearch: string;
};

function expenseEmptyMessage(search: string) {
  return search.trim()
    ? "No expenses match your search."
    : "No petty cash expenses recorded.";
}

export function ExpensesTable({ expenses, loading, expenseSearch }: ExpensesTableProps) {
  const emptyMessage = expenseEmptyMessage(expenseSearch);

  return (
    <div className={financeSectionPanelClassName("flex flex-col")}>
      <h2 className={financeSectionTitleClassName()}>
        <DollarSign className={financeMetricIconClassName("amber")} aria-hidden />
        Petty cash expenses
      </h2>

      <div className="md:hidden space-y-3">
        {loading ? (
          <FinanceTableSkeleton rows={3} />
        ) : expenses.length === 0 ? (
          <p className={cn("text-center py-8 text-sm", text.muted)}>{emptyMessage}</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className={listMobileCardClassName("cursor-default")}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className={cn(typeUiLabelClassName(), text.primary)}>
                    {expense.category}
                  </p>
                  <time className={cn(typeMicroClassName("tabular-nums"), text.subtle)} dateTime={expense.createdAt}>
                    {formatDateTime(expense.createdAt)}
                  </time>
                </div>
                <span className={financeExpenseAmountClassName("shrink-0 text-base")}>
                  -{formatBaht(expense.amount)}
                </span>
              </div>
              {expense.description?.trim() ? (
                <p className={cn("text-sm line-clamp-2 mb-2", text.secondary)}>{expense.description}</p>
              ) : null}
              <p className={cn("text-xs", text.muted)}>
                Recorded by {expense.recordedBy?.name ?? "—"}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        {loading ? (
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
              {expenses.map((expense) => (
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
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className={nativeTableEmptyCellClassName()}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
