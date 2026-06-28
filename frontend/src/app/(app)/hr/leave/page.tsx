"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  CalendarOff,
  CheckCircle,
  Clock,
  Plus,
  XCircle,
} from "lucide-react";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, leaveStatusTone } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { RequestLeaveModal } from "@/components/hr/RequestLeaveModal";
import type { Branch, LeaveRequest, LeaveType } from "@/types/api";
import {
  useCreateLeave,
  useLeaveRequests,
  useUpdateLeaveStatus,
} from "@/hooks/domains/useHrQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, formatDateRange } from "@/lib/intl-date";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
  type LeaveStatusFilter,
  type LeaveTypeFilter,
  filterLeaveRequests,
  leaveDurationDays,
  leaveStatusLabel,
  leaveTypeLabel,
  summarizeLeaveRequests,
} from "@/lib/leave-filters";
import { buildHrLeaveUrl, parseHrLeaveSearchParams } from "@/lib/hr-hub-url";
import {
  expandedRowPanelClassName,
  hrMetaBadgeClassName,
  hrSectionPanelClassName,
  hubCtaClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  inlineLinkClassName,
  tableActionAccentClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

type LeaveConfirmAction = {
  id: number;
  type: "approve" | "reject";
  staffName: string;
  dateRange: string;
};

export default function LeaveRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBranchId, user } = useAuth();
  const role = user?.role;
  const isManagerOrAdmin = role === "SUPER_ADMIN" || role === "MANAGER";
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;

  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;

  const initialStatus = parseHrLeaveSearchParams(searchParams).statusFilter;

  const {
    data: leaveRequests = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLeaveRequests(branchIdNum, isManagerOrAdmin);

  const updateLeaveStatusMutation = useUpdateLeaveStatus();
  const createLeaveMutation = useCreateLeave();

  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<LeaveTypeFilter>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<LeaveConfirmAction | null>(null);

  useEffect(() => {
    setStatusFilter(parseHrLeaveSearchParams(searchParams).statusFilter);
  }, [searchParams]);

  const summary = useMemo(() => summarizeLeaveRequests(leaveRequests), [leaveRequests]);

  const filteredLeaveRequests = useMemo(
    () =>
      filterLeaveRequests(leaveRequests, {
        statusFilter,
        typeFilter,
        search: debouncedSearch,
      }),
    [leaveRequests, statusFilter, typeFilter, debouncedSearch],
  );

  const hasActiveFilters =
    statusFilter !== "ALL" || typeFilter !== "ALL" || search.trim().length > 0;

  const setStatusFilterAndUrl = useCallback(
    (next: LeaveStatusFilter) => {
      setStatusFilter(next);
      router.replace(
        buildHrLeaveUrl(next === "ALL" ? undefined : { status: next }),
        { scroll: false },
      );
    },
    [router],
  );

  const handleCreateLeave = async (payload: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    if (new Date(payload.startDate) > new Date(payload.endDate)) {
      toast.error("End date must be on or after start date");
      return;
    }
    try {
      await createLeaveMutation.mutateAsync(payload);
      toast.success("Leave requested successfully");
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to request leave"));
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmAction) return;
    const status = confirmAction.type === "approve" ? "APPROVED" : "REJECTED";
    try {
      await updateLeaveStatusMutation.mutateAsync({ id: confirmAction.id, status });
      toast.success(`Leave ${status.toLowerCase()}`);
      setConfirmAction(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update leave status"));
    }
  };

  const columns = useMemo(
    () =>
      [
        ...(isManagerOrAdmin
          ? [
              {
                title: "Staff",
                key: "staff",
                render: (_: unknown, req: LeaveRequest) => (
                  <div className="min-w-0">
                    <div className={cn("font-bold truncate", text.primary)}>
                      {req.user?.name ?? `Employee #${req.userId}`}
                    </div>
                    {req.user?.email && (
                      <div className={cn("text-xs truncate", tableCellMutedClassName())}>
                        {req.user.email}
                      </div>
                    )}
                  </div>
                ),
              },
            ]
          : []),
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          render: (type: LeaveType) => (
            <span className={hrMetaBadgeClassName()}>{leaveTypeLabel(type)}</span>
          ),
        },
        {
          title: "Dates",
          key: "dates",
          render: (_: unknown, req: LeaveRequest) => {
            const days = leaveDurationDays(req.startDate, req.endDate);
            return (
              <div className="min-w-0">
                <div className={cn("font-medium", text.primary)}>
                  {formatDateRange(req.startDate, req.endDate)}
                </div>
                <div className={cn("text-xs tabular-nums", text.muted)}>
                  {days} day{days === 1 ? "" : "s"}
                </div>
              </div>
            );
          },
        },
        {
          title: "Reason",
          dataIndex: "reason",
          key: "reason",
          responsive: ["lg"],
          render: (reason: string | null | undefined) =>
            reason?.trim() ? (
              <span className={cn("line-clamp-2 text-sm", text.subtle)}>{reason}</span>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          render: (status: string) => (
            <StatusBadge tone={leaveStatusTone(status)}>{leaveStatusLabel(status)}</StatusBadge>
          ),
        },
        {
          title: "Submitted",
          dataIndex: "createdAt",
          key: "submitted",
          responsive: ["md"],
          render: (createdAt: string | undefined) =>
            createdAt ? (
              <span className={cn("text-sm", text.muted)}>{formatDate(createdAt)}</span>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        ...(isManagerOrAdmin
          ? [
              {
                title: "Actions",
                key: "actions",
                align: "right" as const,
                width: 96,
                render: (_: unknown, req: LeaveRequest) =>
                  req.status === "PENDING" ? (
                    <div className="flex justify-end gap-1">
                      <TableActionButton
                        icon={CheckCircle}
                        label={`Approve leave for ${req.user?.name ?? "employee"}`}
                        iconOnly
                        onClick={() =>
                          setConfirmAction({
                            id: req.id,
                            type: "approve",
                            staffName: req.user?.name ?? "Employee",
                            dateRange: formatDateRange(req.startDate, req.endDate),
                          })
                        }
                        className={tableActionAccentClassName("emerald")}
                      />
                      <TableActionButton
                        icon={XCircle}
                        label={`Reject leave for ${req.user?.name ?? "employee"}`}
                        iconOnly
                        onClick={() =>
                          setConfirmAction({
                            id: req.id,
                            type: "reject",
                            staffName: req.user?.name ?? "Employee",
                            dateRange: formatDateRange(req.startDate, req.endDate),
                          })
                        }
                        destructive
                      />
                    </div>
                  ) : null,
              },
            ]
          : []),
      ] as ColumnsType<LeaveRequest>,
    [isManagerOrAdmin],
  );

  const expandedRowRender = (record: LeaveRequest) => (
    <div className={expandedRowPanelClassName()}>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className={cn("text-xs font-medium uppercase tracking-wide", text.muted)}>Reason</dt>
          <dd className={cn("mt-1", text.primary)}>{record.reason?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className={cn("text-xs font-medium uppercase tracking-wide", text.muted)}>
            Duration
          </dt>
          <dd className={cn("mt-1 tabular-nums font-medium", text.primary)}>
            {leaveDurationDays(record.startDate, record.endDate)} day
            {leaveDurationDays(record.startDate, record.endDate) === 1 ? "" : "s"}
          </dd>
        </div>
      </dl>
    </div>
  );

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view and manage leave requests." />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HubPageHeader
          hideTitle
          icon={CalendarOff}
          accentHub="hr"
          actions={
            <Button
              className={hubCtaClassName("hr", "font-bold")}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              Request leave
            </Button>
          }
        />

        <HubListPage className={hrSectionPanelClassName()}>
          {isManagerOrAdmin && summary.pending > 0 && initialStatus === "PENDING" && (
            <HubListPage.Banner>
              <div className={infoBannerClassName()}>
                <div className="flex items-start gap-3">
                  <Briefcase className={infoBannerIconClassName()} aria-hidden />
                  <div>
                    <p className={infoBannerTitleClassName()}>Leave awaiting approval</p>
                    <p className={infoBannerTextClassName()}>
                      {summary.pending} request{summary.pending === 1 ? "" : "s"}{" "}
                      {summary.pending === 1 ? "needs" : "need"} your review at this branch.
                    </p>
                  </div>
                </div>
              </div>
            </HubListPage.Banner>
          )}

          <HubListPage.Error
            message={isError ? getErrorMessage(error, "Failed to load leave requests") : undefined}
            onRetry={() => void refetch()}
            loading={isFetching}
          />

          <HubListPage.Toolbar
            search={isManagerOrAdmin ? search : undefined}
            onSearchChange={isManagerOrAdmin ? setSearch : undefined}
            searchPlaceholder="Search staff or reason…"
            branchName={branchName}
            showReset={hasActiveFilters}
            onReset={() => {
              setStatusFilterAndUrl("ALL");
              setTypeFilter("ALL");
              setSearch("");
            }}
            filters={
              <>
                <ListFilterSelect
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilterAndUrl(value as LeaveStatusFilter)}
                  ariaLabel="Filter by leave status"
                  widthClassName="w-full sm:w-[180px]"
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "PENDING", label: "Pending" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                />
                <ListFilterSelect
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as LeaveTypeFilter)}
                  ariaLabel="Filter by leave type"
                  widthClassName="w-full sm:w-[180px]"
                  options={[
                    { value: "ALL", label: "All types" },
                    { value: "SICK", label: "Sick leave" },
                    { value: "ANNUAL", label: "Annual leave" },
                    { value: "UNPAID", label: "Unpaid leave" },
                  ]}
                />
              </>
            }
          />

          <HubListPage.Count
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredLeaveRequests.length}
            totalCount={leaveRequests.length}
            itemLabel="request"
            emptyLabel="No leave requests yet"
            actions={
              <Link
                href="/hr/attendance"
                className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden />
                View attendance
              </Link>
            }
          />

          <DataTable
            columns={columns}
            dataSource={filteredLeaveRequests}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            emptyDescription={
              hasActiveFilters
                ? "No leave requests match the current filters."
                : isManagerOrAdmin
                  ? "No leave requests for this branch yet."
                  : "Submit a leave request to get started."
            }
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => Boolean(record.reason?.trim()),
            }}
          />
        </HubListPage>
      </div>

      <RequestLeaveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLeave}
        isSubmitting={createLeaveMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === "approve"
            ? "Approve this leave request?"
            : "Reject this leave request?"
        }
        description={
          confirmAction
            ? `${confirmAction.staffName} · ${confirmAction.dateRange}`
            : undefined
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Reject"}
        destructive={confirmAction?.type === "reject"}
        loading={updateLeaveStatusMutation.isPending}
        onConfirm={handleConfirmStatusUpdate}
      />
    </>
  );
}
