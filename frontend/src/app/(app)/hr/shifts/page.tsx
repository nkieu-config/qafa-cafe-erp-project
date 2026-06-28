"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, format, subDays } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useCreateShift, useHrUsers, useShifts } from "@/hooks/domains/useHrQueries";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
} from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterDate, ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { RoleGuard } from "@/components/RoleGuard";
import { AccessDeniedState } from "@/components/shared/access-denied-state";
import { CreateShiftModal } from "@/components/hr/CreateShiftModal";
import { ShiftGanttTimeline } from "@/components/hr/ShiftGanttTimeline";
import { Button } from "@/components/ui/button";
import type { Branch, ShiftStatus, User } from "@/types/api";
import {
  filterShifts,
  groupShiftsByUserId,
  summarizeShifts,
  type ShiftStatusFilter,
  type ShiftWithUser,
} from "@/lib/shift-filters";
import { parseHrShiftsSearchParams } from "@/lib/hr-hub-url";
import { formatDate } from "@/lib/intl-date";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import {
  ganttPanelClassName,
  hubCardIconFor,
  hubCtaClassName,
  hrSectionPanelClassName,
  hubLoadingSpinnerClassName,
  inlineLinkClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function EmployeesShiftsPage() {
  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "MANAGER"]}
      fallback={
        <AccessDeniedState
          description="Manager or Super Admin access is required to manage shift schedules."
          backHref="/hr/attendance"
          backLabel="Back to Attendance"
        />
      }
    >
      <ShiftsPageContent />
    </RoleGuard>
  );
}

function ShiftsPageContent() {
  const { user, activeBranchId } = useAuth();
  const role = user?.role;
  const searchParams = useSearchParams();
  const urlState = useMemo(() => parseHrShiftsSearchParams(searchParams), [searchParams]);

  const { data: branches = [] } = useBranches();
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;

  const {
    data: shiftsData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useShifts(role, branchIdNum);
  const { data: employees = [] } = useHrUsers(branchIdNum);
  const createShiftMutation = useCreateShift();

  const [selectedDate, setSelectedDate] = useState(() => urlState.date ?? toDateInputValue(new Date()));
  const [statusFilter, setStatusFilter] = useState<ShiftStatusFilter>("ALL");
  const [employeeFilterId, setEmployeeFilterId] = useState<number | null>(urlState.employeeId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (urlState.date) setSelectedDate(urlState.date);
    if (urlState.employeeId != null) setEmployeeFilterId(urlState.employeeId);
  }, [urlState.date, urlState.employeeId]);

  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);

  const filteredShifts = useMemo(
    () =>
      filterShifts(shiftsData as ShiftWithUser[], {
        date: selectedDateObj,
        statusFilter,
        employeeId: employeeFilterId,
      }),
    [shiftsData, selectedDateObj, statusFilter, employeeFilterId],
  );

  const summary = useMemo(() => summarizeShifts(filteredShifts), [filteredShifts]);
  const ganttRows = useMemo(() => groupShiftsByUserId(filteredShifts), [filteredShifts]);

  const hasActiveFilters = statusFilter !== "ALL" || employeeFilterId != null;

  const shiftDateLabel = formatDate(selectedDateObj);

  const handleCreateShift = async (payload: {
    userId: number;
    branchId: number;
    startTime: string;
    endTime: string;
  }) => {
    try {
      await createShiftMutation.mutateAsync(payload);
      toast.success("Shift scheduled");
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to schedule shift"));
    }
  };

  if (!activeBranchId || !branchIdNum) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view and manage shift schedules." />
    );
  }

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        icon={CalendarDays}
        accentHub="hr"
        actions={
          <Button
            className={hubCtaClassName("hr", "font-bold")}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Schedule shift
          </Button>
        }
      />

      <HubListPage className={hrSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load shifts") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          branchName={branchName}
          showReset={hasActiveFilters}
          onReset={() => {
            setStatusFilter("ALL");
            setEmployeeFilterId(null);
          }}
          filters={
            <>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] shrink-0"
                  aria-label="Previous day"
                  onClick={() =>
                    setSelectedDate(toDateInputValue(subDays(selectedDateObj, 1)))
                  }
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                </Button>
                <ListFilterDate
                  value={selectedDate}
                  onChange={setSelectedDate}
                  ariaLabel="Shift date"
                  className="w-full sm:w-[160px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] shrink-0"
                  aria-label="Next day"
                  onClick={() =>
                    setSelectedDate(toDateInputValue(addDays(selectedDateObj, 1)))
                  }
                >
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </Button>
              </div>
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ShiftStatusFilter)}
                ariaLabel="Filter by shift status"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  ...(["SCHEDULED", "COMPLETED", "ABSENT", "CANCELLED"] as ShiftStatus[]).map(
                    (status) => ({
                      value: status,
                      label: status.charAt(0) + status.slice(1).toLowerCase(),
                    }),
                  ),
                ]}
              />
              {employees.length > 0 && (
                <ListFilterSelect
                  value={employeeFilterId != null ? String(employeeFilterId) : "ALL"}
                  onValueChange={(value) => {
                    setEmployeeFilterId(value === "ALL" ? null : Number(value));
                  }}
                  ariaLabel="Filter by employee"
                  widthClassName="w-full sm:w-[200px]"
                  options={[
                    { value: "ALL", label: "All employees" },
                    ...employees.map((employee: User) => ({
                      value: String(employee.id),
                      label: employee.name ?? employee.email,
                    })),
                  ]}
                />
              )}
            </>
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          actions={
            <Link
              href="/hr/attendance"
              className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden />
              View attendance
            </Link>
          }
        >
          {formatHubListCountWithFetching(
            hasActiveFilters
              ? `${filteredShifts.length} of ${(shiftsData as ShiftWithUser[]).length} shifts · ${shiftDateLabel}`
              : summary.total > 0
                ? `${summary.total} shift${summary.total === 1 ? "" : "s"} · ${shiftDateLabel}`
                : `${shiftDateLabel} — no shifts scheduled`,
            isFetching,
            isLoading,
          )}
        </HubListPage.Count>

        <div className={ganttPanelClassName()}>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className={hubLoadingSpinnerClassName("w-8 h-8")} aria-hidden />
              <span className="sr-only">Loading shift schedule…</span>
            </div>
          ) : !isError && ganttRows.length === 0 ? (
            <div className="py-16 text-center px-4">
              <CalendarDays className={hubCardIconFor("hr", "w-12 h-12 mx-auto mb-4")} />
              <p className={cn("font-semibold", text.primary)}>
                {hasActiveFilters ? "No shifts match your filters" : "No shifts scheduled"}
              </p>
              <p className={cn("text-sm mt-2 max-w-md mx-auto", text.muted)}>
                {hasActiveFilters
                  ? "Try another date, status, or employee filter."
                  : `No shifts on ${shiftDateLabel}. Schedule a block to populate the timeline.`}
              </p>
              {!hasActiveFilters && (
                <Button
                  className={cn("mt-6", hubCtaClassName("hr", "font-bold"))}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden />
                  Schedule shift
                </Button>
              )}
            </div>
          ) : !isError ? (
            <ShiftGanttTimeline rows={ganttRows} />
          ) : null}
        </div>
      </HubListPage>

      <CreateShiftModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        branchId={branchIdNum}
        defaultDate={selectedDate}
        onSubmit={handleCreateShift}
        isSubmitting={createShiftMutation.isPending}
      />
    </div>
  );
}
