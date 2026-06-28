"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/context/AuthContext";
import {
  useActiveClockIn,
  useAttendance,
  useClockIn,
  useClockOut,
  useMyShifts,
} from "@/hooks/domains/useHrQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Loader2,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterDate, ListFilterRow, ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { Branch, Shift } from "@/types/api";
import { formatDate, formatTime } from "@/lib/intl-date";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import {
  type AttendanceRecordRow,
  type AttendanceStatusFilter,
  filterAttendance,
  isActiveRecord,
  isAttendanceLate,
  summarizeAttendance,
} from "@/lib/attendance-filters";
import {
  attendanceLateRowClassName,
  attendanceLateTimeClassName,
  attendanceOnTimeClassName,
  hubCtaClassName,
  hrSectionPanelClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  inlineLinkClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function useElapsedTimer(clockIn: string | undefined | null) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!clockIn) {
      setElapsed("");
      return;
    }

    const start = new Date(clockIn).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsed(
        `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [clockIn]);

  return elapsed;
}

export default function AttendancePage() {
  const { user, activeBranchId } = useAuth();
  const role = user?.role;
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;

  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;

  const {
    data: attendanceData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAttendance();
  const { data: shiftsData } = useMyShifts();
  const {
    data: activeClockIn,
    isLoading: loadingActive,
    isFetching: fetchingActive,
  } = useActiveClockIn();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const attendance = (attendanceData ?? []) as AttendanceRecordRow[];
  const shifts = (shiftsData ?? []) as Shift[];
  const isClockedIn = Boolean(activeClockIn);
  const elapsed = useElapsedTimer(isClockedIn ? activeClockIn?.clockIn : null);

  const startDateObj = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const endDateObj = endDate ? new Date(`${endDate}T00:00:00`) : null;

  const summary = useMemo(
    () => summarizeAttendance(attendance, shifts),
    [attendance, shifts],
  );

  const filteredAttendance = useMemo(
    () =>
      filterAttendance(attendance, {
        statusFilter,
        startDate: startDateObj,
        endDate: endDateObj,
        shifts,
      }),
    [attendance, statusFilter, startDateObj, endDateObj, shifts],
  );

  const hasActiveFilters =
    statusFilter !== "ALL" || startDate.length > 0 || endDate.length > 0;

  const handleClockIn = async () => {
    if (!activeBranchId) {
      toast.error("Please select a branch before clocking in.");
      return;
    }
    try {
      await clockInMutation.mutateAsync(Number(activeBranchId));
      toast.success("Clocked in successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to clock in"));
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOutMutation.mutateAsync();
      toast.success("Clocked out successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to clock out"));
    }
  };

  const needsBranchForClockIn = role === "SUPER_ADMIN" && !activeBranchId;
  const clockActionPending = clockInMutation.isPending || clockOutMutation.isPending;

  const columns = useMemo(
    () =>
      [
        {
          title: "Date",
          dataIndex: "clockIn",
          key: "date",
          render: (val: string) => (
            <span className={cn("font-medium", text.primary)}>{formatDate(val)}</span>
          ),
        },
        {
          title: "Clock In",
          dataIndex: "clockIn",
          key: "in",
          render: (val: string) => {
            const { isLate, lateMinutes, shift } = isAttendanceLate(val, shifts);
            return (
              <div className="flex items-center gap-2">
                <span
                  className={
                    isLate ? attendanceLateTimeClassName() : attendanceOnTimeClassName()
                  }
                >
                  {formatTime(val)}
                </span>
                {isLate && shift && (
                  <span
                    title={`Late by ${lateMinutes} min — shift started ${formatTime(shift.startTime)}`}
                  >
                    <StatusBadge tone="danger" className="gap-1">
                      <AlertCircle className="w-3 h-3" aria-hidden />
                      Late
                    </StatusBadge>
                  </span>
                )}
              </div>
            );
          },
        },
        {
          title: "Clock Out",
          dataIndex: "clockOut",
          key: "out",
          render: (val: string | null) =>
            val ? (
              <span className={cn("font-mono font-medium tabular-nums", text.subtle)}>
                {formatTime(val)}
              </span>
            ) : (
              <StatusBadge tone="info" className="animate-pulse motion-reduce:animate-none">
                Active
              </StatusBadge>
            ),
        },
        {
          title: "Branch",
          dataIndex: ["branch", "name"],
          key: "branch",
          responsive: ["md"],
          render: (name: string) =>
            name ? (
              <StatusBadge tone="category">{name}</StatusBadge>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
        {
          title: "Hours",
          dataIndex: "totalHours",
          key: "hours",
          align: "right" as const,
          render: (val: number | null, record: AttendanceRecordRow) =>
            val != null && val > 0 ? (
              <span className={cn("font-bold tabular-nums", text.primary)}>
                {val.toFixed(2)} hrs
              </span>
            ) : isActiveRecord(record) ? (
              <span className={cn("text-xs font-medium", text.muted)}>In progress</span>
            ) : (
              <span className={text.muted}>—</span>
            ),
        },
      ] as ColumnsType<AttendanceRecordRow>,
    [shifts],
  );

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to clock in and view attendance records." />
    );
  }

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        icon={Clock}
        accentHub="hr"
        actions={
          isClockedIn ? (
            <Button
              variant="destructive"
              className={cn(hubCtaClassName("hr", "font-bold"), "shadow-sm")}
              disabled={clockActionPending || loadingActive}
              onClick={() => void handleClockOut()}
            >
              {clockOutMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <StopCircle className="w-4 h-4 mr-2" aria-hidden />
              )}
              Clock out
            </Button>
          ) : (
            <Button
              className={hubCtaClassName("hr", "font-bold")}
              disabled={needsBranchForClockIn || clockActionPending || loadingActive}
              onClick={() => void handleClockIn()}
            >
              {clockInMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" aria-hidden />
              )}
              Clock in
            </Button>
          )
        }
      />

      <HubListPage className={hrSectionPanelClassName()}>
        {isClockedIn && activeClockIn && (
          <HubListPage.Banner>
            <div className={infoBannerClassName()}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Clock className={infoBannerIconClassName()} aria-hidden />
                  <div className="min-w-0">
                    <p className={infoBannerTitleClassName()}>Currently clocked in</p>
                    <p className={infoBannerTextClassName()}>
                      Started {formatTime(activeClockIn.clockIn)} at{" "}
                      {activeClockIn.branch?.name ?? branchName ?? "this branch"}
                      {elapsed && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="font-mono tabular-nums font-semibold text-[var(--status-info-fg)]">
                            {elapsed}
                          </span>{" "}
                          elapsed
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 min-h-[44px] font-semibold"
                  disabled={clockActionPending}
                  onClick={() => void handleClockOut()}
                >
                  <StopCircle className="w-4 h-4 mr-2" aria-hidden />
                  Clock out
                </Button>
              </div>
            </div>
          </HubListPage.Banner>
        )}

        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load attendance records") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          branchName={branchName}
          showReset={hasActiveFilters}
          onReset={() => {
            setStatusFilter("ALL");
            setStartDate("");
            setEndDate("");
          }}
          filters={
            <ListFilterRow>
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AttendanceStatusFilter)}
                ariaLabel="Filter by attendance status"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  { value: "active", label: "Active session" },
                  { value: "late", label: "Late" },
                  { value: "on-time", label: "On time" },
                ]}
              />
              <ListFilterDate
                value={startDate}
                onChange={setStartDate}
                ariaLabel="From date"
                className="w-full sm:w-[160px]"
              />
              <ListFilterDate
                value={endDate}
                onChange={setEndDate}
                ariaLabel="To date"
                className="w-full sm:w-[160px]"
                min={startDate || undefined}
              />
            </ListFilterRow>
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching || fetchingActive}
          actions={
            <Link
              href="/hr/shifts"
              className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
            >
              <CalendarDays className="w-3.5 h-3.5" aria-hidden />
              View shifts
            </Link>
          }
        >
          {formatHubListCountWithFetching(
            (() => {
              const base = hasActiveFilters
                ? `${filteredAttendance.length} of ${attendance.length} records`
                : summary.total > 0
                  ? `${summary.total} record${summary.total === 1 ? "" : "s"} · last 30 days`
                  : "No attendance records yet";
              return summary.totalHours > 0 && !hasActiveFilters
                ? `${base} · ${summary.totalHours.toFixed(1)} hrs logged`
                : base;
            })(),
            isFetching || fetchingActive,
            isLoading,
          )}
        </HubListPage.Count>

        <DataTable
          columns={columns}
          dataSource={filteredAttendance}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          emptyDescription={
            hasActiveFilters
              ? "No records match the current filters."
              : "Clock in to start tracking your attendance."
          }
          rowClassName={(record: AttendanceRecordRow) => {
            if (record.user?.role === "SUPER_ADMIN") return "";
            const { isLate } = isAttendanceLate(record.clockIn, shifts);
            return isLate ? attendanceLateRowClassName() : "";
          }}
        />
      </HubListPage>
    </div>
  );
}
