"use client";

import { CheckCircle2 } from "lucide-react";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, settlementStatusTone } from "@/components/shared/status-badge";
import { FinanceTableSkeleton } from "@/components/finance/FinanceTableSkeleton";
import { formatDate } from "@/lib/intl-date";
import { formatBaht } from "@/lib/money";
import { settlementStatusLabel, type SettlementStatusFilter } from "@/lib/finance-overview-filters";
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
import { financeSectionPanelClassName, financeSectionTitleClassName, financeHubIconClassName, settlementDifferenceClassName } from "@/lib/theme/finance";
import { tableActionAccentClassName } from "@/lib/theme/hub-primitives";
import { text } from "@/lib/theme/surface";
import { typeMicroClassName, typeUiLabelClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import type { Settlement } from "@/types/api";

type SettlementsTableProps = {
  settlements: Settlement[];
  loading: boolean;
  settlementFilter: SettlementStatusFilter;
  onApprove: (settlement: Settlement) => void;
};

function settlementEmptyMessage(filter: SettlementStatusFilter) {
  return filter !== "ALL"
    ? "No settlements match the current filter."
    : "No shift settlements recorded yet.";
}

export function SettlementsTable({
  settlements,
  loading,
  settlementFilter,
  onApprove,
}: SettlementsTableProps) {
  const emptyMessage = settlementEmptyMessage(settlementFilter);

  return (
    <div className={financeSectionPanelClassName("flex flex-col")}>
      <h2 className={financeSectionTitleClassName("mb-4")}>
        <CheckCircle2 className={financeHubIconClassName()} aria-hidden />
        Shift settlements
      </h2>

      <div className="md:hidden space-y-3">
        {loading ? (
          <FinanceTableSkeleton rows={3} />
        ) : settlements.length === 0 ? (
          <p className={cn("text-center py-8 text-sm", text.muted)}>{emptyMessage}</p>
        ) : (
          settlements.map((settlement) => (
            <div key={settlement.id} className={listMobileCardClassName("cursor-default")}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className={cn(typeUiLabelClassName(), text.primary)}>
                    {settlement.branch?.name ?? "Main"}
                  </p>
                  <time className={cn(typeMicroClassName("tabular-nums"), text.subtle)} dateTime={settlement.date}>
                    {formatDate(settlement.date)}
                  </time>
                </div>
                <StatusBadge tone={settlementStatusTone(settlement.status)}>
                  {settlementStatusLabel(settlement.status)}
                </StatusBadge>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <dt className={text.muted}>Expected</dt>
                  <dd className="tabular-nums font-medium">{formatBaht(settlement.expectedCash)}</dd>
                </div>
                <div>
                  <dt className={text.muted}>Actual</dt>
                  <dd className="tabular-nums font-medium">{formatBaht(settlement.actualCash)}</dd>
                </div>
                <div>
                  <dt className={text.muted}>Diff</dt>
                  <dd className={settlementDifferenceClassName(settlement.difference, "tabular-nums font-medium")}>
                    {settlement.difference === 0
                      ? formatBaht(0)
                      : `${settlement.difference > 0 ? "+" : "-"}${formatBaht(Math.abs(settlement.difference))}`}
                  </dd>
                </div>
              </dl>
              {settlement.status === "PENDING" && (
                <TableActionButton
                  icon={CheckCircle2}
                  label="Approve settlement"
                  onClick={() => onApprove(settlement)}
                  className={cn(tableActionAccentClassName("emerald"), "w-full justify-center")}
                />
              )}
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
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Diff</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className={nativeTableBodyClassName()}>
              {settlements.map((settlement) => (
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
                        onClick={() => onApprove(settlement)}
                        className={tableActionAccentClassName("emerald")}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className={nativeTableEmptyCellClassName()}>
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
