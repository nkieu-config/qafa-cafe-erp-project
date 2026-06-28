"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Activity, FileText, ChevronLeft, ChevronRight, Eye, History, Loader2 } from "lucide-react";
import { useAuditLogs } from "@/hooks/domains/useReportsQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { StatusBadge, auditActionTone } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { AuditLogDetailSheet } from "@/components/settings/AuditLogDetailSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AuditActionCategory,
  type AuditLogRow,
  type AuditTargetTypeFilter,
  auditActionLabel,
  auditTargetTypeLabel,
  filterAuditLogs,
  formatAuditDetails,
  uniqueAuditTargetTypes,
} from "@/lib/audit-filters";
import { roleLabel } from "@/lib/employee-filters";
import { formatDateTime } from "@/lib/intl-date";
import { getErrorMessage } from "@/lib/errors";
import {
  dataTableContainerClassName,
  hubLoadingSpinnerClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  nativeTableEmptyCellClassName,
  semanticTableClassName,
  settingsSectionPanelClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const FETCH_BATCH = 100;

export default function AuditLogsPage() {
  const [fetchLimit, setFetchLimit] = useState(FETCH_BATCH);
  const {
    data: logsData = [],
    isLoading: loading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAuditLogs(fetchLimit, 0);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [actionFilter, setActionFilter] = useState<AuditActionCategory>("ALL");
  const [targetTypeFilter, setTargetTypeFilter] = useState<AuditTargetTypeFilter>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const logs = logsData as AuditLogRow[];
  const targetTypes = useMemo(() => uniqueAuditTargetTypes(logs), [logs]);
  const entryCount = logs.length;

  const filteredLogs = useMemo(
    () =>
      filterAuditLogs(logs, {
        search: debouncedSearch,
        actionFilter,
        targetTypeFilter,
      }),
    [logs, debouncedSearch, actionFilter, targetTypeFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const mayHaveOlderEntries = logs.length >= fetchLimit;

  const pageLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const hasActiveFilters =
    search.trim().length > 0 || actionFilter !== "ALL" || targetTypeFilter !== "ALL";

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetFilters = () => {
    setSearch("");
    setActionFilter("ALL");
    setTargetTypeFilter("ALL");
    setPage(1);
  };

  const entryCountLabel = (count: number) =>
    `${count} entr${count === 1 ? "y" : "ies"}`;

  const formatLoadedSummary = () => {
    const olderSuffix = mayHaveOlderEntries ? ` · latest ${fetchLimit} loaded` : "";
    if (hasActiveFilters) {
      return `${filteredLogs.length} of ${entryCount} entries${olderSuffix}`;
    }
    return `${entryCountLabel(entryCount)}${olderSuffix}`;
  };

  return (
    <div className="space-y-6 max-w-6xl w-full">
      <HubPageHeader hideTitle accentHub="settings" />

      <HubListPage className={settingsSectionPanelClassName()}>
        {!loading && !isError && entryCount === 0 && (
          <HubListPage.Banner>
            <div className={infoBannerClassName()}>
              <div className="flex items-start gap-3">
                <History className={infoBannerIconClassName()} aria-hidden />
                <div>
                  <p className={infoBannerTitleClassName()}>No audit entries yet</p>
                  <p className={infoBannerTextClassName()}>
                    Critical actions such as purchase orders, stock transfers, settlements, and waste
                    adjustments appear here once recorded by the system.
                  </p>
                </div>
              </div>
            </div>
          </HubListPage.Banner>
        )}

        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load audit logs.") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search action, user, module…"
          showReset={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <>
              <ListFilterSelect
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value as AuditActionCategory);
                  setPage(1);
                }}
                ariaLabel="Filter by action type"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All actions" },
                  { value: "create", label: "Create" },
                  { value: "update", label: "Update" },
                  { value: "approve", label: "Approve" },
                  { value: "delete", label: "Delete / reject" },
                  { value: "other", label: "Other" },
                ]}
              />
              {targetTypes.length > 1 && (
                <ListFilterSelect
                  value={targetTypeFilter}
                  onValueChange={(value) => {
                    setTargetTypeFilter(value as AuditTargetTypeFilter);
                    setPage(1);
                  }}
                  ariaLabel="Filter by target module"
                  widthClassName="w-full sm:w-[180px]"
                  options={[
                    { value: "ALL", label: "All modules" },
                    ...targetTypes.map((targetType) => ({
                      value: targetType,
                      label: auditTargetTypeLabel(targetType),
                    })),
                  ]}
                />
              )}
            </>
          }
        />

        {entryCount > 0 && (
          <HubListPage.Count
            isLoading={loading}
            isError={isError}
            isFetching={isFetching}
            actions={
              mayHaveOlderEntries ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 min-h-[44px] font-medium"
                  disabled={isFetching}
                  onClick={() => setFetchLimit((current) => current + FETCH_BATCH)}
                >
                  {isFetching ? (
                    <Loader2
                      className={cn("w-4 h-4 mr-2 animate-spin", hubLoadingSpinnerClassName())}
                      aria-hidden
                    />
                  ) : null}
                  Load older entries
                </Button>
              ) : undefined
            }
          >
            {formatLoadedSummary()}
          </HubListPage.Count>
        )}

        <div className={dataTableContainerClassName()}>
          <div className={semanticTableClassName()}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Target module</TableHead>
                  <TableHead className="hidden lg:table-cell max-w-md">Details</TableHead>
                  <TableHead className="w-[88px] text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pageLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className={nativeTableEmptyCellClassName("h-24")}>
                      {hasActiveFilters
                        ? "No audit entries match your filters."
                        : "No audit entries recorded yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageLogs.map((log) => {
                    const details = formatAuditDetails(log.details);
                    return (
                      <TableRow key={log.id}>
                        <TableCell
                          className={cn("font-medium whitespace-nowrap tabular-nums", text.subtle)}
                        >
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <User className={cn("w-4 h-4 shrink-0", text.muted)} aria-hidden />
                            <div className="min-w-0">
                              <span className={cn("font-medium block truncate", text.primary)}>
                                {log.user?.name || log.user?.email}
                              </span>
                              {log.user?.role && (
                                <span className={cn("text-xs block truncate", text.muted)}>
                                  {roleLabel(log.user.role)}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={auditActionTone(log.action)}>
                            {auditActionLabel(log.action)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className={cn("flex items-center gap-1.5 min-w-0", text.secondary)}>
                            <Activity className={cn("w-4 h-4 shrink-0", text.muted)} aria-hidden />
                            <span className="truncate">{auditTargetTypeLabel(log.targetType)}</span>
                            {log.targetId != null && (
                              <span className={cn("shrink-0 tabular-nums", text.muted)}>
                                #{log.targetId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-md">
                          <div className={cn("flex items-start gap-1.5 text-sm min-w-0", text.muted)}>
                            <FileText className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                            <span className="truncate">{details.preview}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TableActionButton
                            label="View entry"
                            icon={Eye}
                            iconOnly
                            tone="blue"
                            onClick={() => setSelectedLog(log)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {!loading && filteredLogs.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className={cn("text-sm tabular-nums", text.muted)}>
              Page {currentPage} of {totalPages} ({filteredLogs.length} entries)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
                disabled={currentPage <= 1}
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </HubListPage>

      <AuditLogDetailSheet
        log={selectedLog}
        open={selectedLog != null}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
