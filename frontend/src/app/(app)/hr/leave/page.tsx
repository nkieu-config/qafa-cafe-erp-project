"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, CheckCircle, XCircle, CalendarOff } from "lucide-react";
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, leaveStatusTone } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { LeaveRequest, Branch } from "@/types/api";
import { useLeaveRequests, useUpdateLeaveStatus, useCreateLeave } from "@/hooks/domains/useHrQueries";
import { formatDateRange } from "@/lib/intl-date";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { hubCtaClassName, tableActionAccentClassName } from "@/lib/theme";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";

const LEAVE_TYPES = [
  { value: "SICK", label: "Sick Leave" },
  { value: "ANNUAL", label: "Annual Leave" },
  { value: "UNPAID", label: "Unpaid Leave" },
] as const;

export default function LeaveRequestsPage() {
  const { activeBranchId, user } = useAuth();
  const role = user?.role;
  const isManagerOrAdmin = role === "SUPER_ADMIN" || role === "MANAGER";
  const searchParams = useSearchParams();
  const pendingFromUrl = searchParams.get("status") === "PENDING";
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;

  const {
    data: leaveRequests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLeaveRequests(branchIdNum, isManagerOrAdmin);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING">(
    pendingFromUrl ? "PENDING" : "ALL",
  );

  useEffect(() => {
    if (searchParams.get("status") === "PENDING") setStatusFilter("PENDING");
  }, [searchParams]);

  const visibleLeaveRequests = useMemo(() => {
    if (statusFilter !== "PENDING") return leaveRequests;
    return leaveRequests.filter((req: LeaveRequest) => req.status === "PENDING");
  }, [leaveRequests, statusFilter]);
  const updateLeaveStatusMutation = useUpdateLeaveStatus();
  const createLeaveMutation = useCreateLeave();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<string>("");
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [reason, setReason] = useState("");

  const resetForm = () => {
    setLeaveType("");
    setDates(null);
    setReason("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const approveLeave = async (id: number, status: string) => {
    try {
      await updateLeaveStatusMutation.mutateAsync({ id, status });
      toast.success(`Leave status updated to ${status}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update leave status"));
    }
  };

  const handleCreateLeave = async () => {
    if (!leaveType) {
      toast.error("Please select leave type");
      return;
    }
    if (!dates?.[0] || !dates?.[1]) {
      toast.error("Please select dates");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      await createLeaveMutation.mutateAsync({
        type: leaveType,
        startDate: dates[0].toDate().toISOString(),
        endDate: dates[1].toDate().toISOString(),
        reason: reason.trim(),
      });
      toast.success("Leave requested successfully");
      closeModal();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to request leave"));
    }
  };

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view and manage leave requests." />
    );
  }

  return (
    <>
      <HubCard
        title="Leave Requests"
        icon={CalendarOff}
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            className={hubCtaClassName("hr", "rounded-xl shadow-lg")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        }
      >
        {isError && (
          <QueryErrorBanner
            message={getErrorMessage(error, "Failed to load leave requests")}
            onRetry={() => void refetch()}
          />
        )}
        {isManagerOrAdmin && (
          <ListToolbar
            branchName={branchName}
            filters={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING")}
                className="min-h-[44px] rounded-md border px-3 text-sm border-[var(--border)] bg-[var(--table-container-bg)] text-[var(--foreground)]"
                aria-label="Filter leave requests by status"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending approval</option>
              </select>
            }
          />
        )}
        <DataTable
          columns={[
            ...(role === "SUPER_ADMIN" || role === "MANAGER"
              ? [{ title: "Staff", dataIndex: ["user", "name"], key: "staff" }]
              : []),
            { title: "Type", dataIndex: "type", key: "type" },
            {
              title: "Dates",
              key: "dates",
              render: (_: unknown, req: LeaveRequest) =>
                formatDateRange(req.startDate, req.endDate),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status: string) => (
                <StatusBadge tone={leaveStatusTone(status)}>{status}</StatusBadge>
              ),
            },
            ...(role === "SUPER_ADMIN" || role === "MANAGER"
              ? [
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_: unknown, req: LeaveRequest) =>
                      req.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <TableActionButton
                            icon={CheckCircle}
                            label="Approve"
                            iconOnly
                            onClick={() => approveLeave(req.id, "APPROVED")}
                            className={tableActionAccentClassName("emerald")}
                          />
                          <TableActionButton
                            icon={XCircle}
                            label="Reject"
                            iconOnly
                            onClick={() => approveLeave(req.id, "REJECTED")}
                            destructive
                          />
                        </div>
                      ) : null,
                  },
                ]
              : []),
          ]}
          dataSource={visibleLeaveRequests}
          rowKey="id"
          loading={isLoading}
        />
      </HubCard>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="w-5 h-5" />
              Request Leave
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Leave Type</Label>
              <Select value={leaveType} onValueChange={(v) => v && setLeaveType(v)}>
                <SelectTrigger id="leave-type" className="w-full">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-dates">Dates</Label>
              <DatePicker.RangePicker
                id="leave-dates"
                className="w-full h-10"
                value={dates}
                onChange={(vals) => setDates(vals as [Dayjs, Dayjs] | null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason</Label>
              <textarea
                id="leave-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain your reason…"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              className={hubCtaClassName("hr")}
              disabled={createLeaveMutation.isPending}
              onClick={() => void handleCreateLeave()}
            >
              {createLeaveMutation.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
