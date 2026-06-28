"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useHrUsers, useUpdateHourlyRate } from "@/hooks/domains/useHrQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { Avatar } from "antd";
import { Plus, Users, Edit3 } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, employeeRoleTone } from "@/components/shared/status-badge";
import { EditCompensationModal } from "@/components/hr/EditCompensationModal";
import { ButtonLink } from "@/components/ui/button-link";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Branch, User } from "@/types/api";
import { formatBaht } from "@/lib/money";
import {
  type EmployeeRateFilter,
  type EmployeeRoleFilter,
  type EmploymentTypeFilter,
  employeeHasMissingRate,
  filterEmployees,
} from "@/lib/employee-filters";
import { buildHrPayrollUrl } from "@/lib/hr-hub-url";
import {
  expandedRowPanelClassName,
  hrAvatarClassName,
  hrSectionPanelClassName,
  hubCtaClassName,
  inlineLinkClassName,
  metricValueClassName,
  tableActionAccentClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function EmployeeDirectoryPage() {
  const { user, activeBranchId } = useAuth();
  const role = user?.role;
  const canEditCompensation = role === "SUPER_ADMIN" || role === "MANAGER";
  const canLinkPayroll = canEditCompensation;

  const { data: branches = [] } = useBranches();
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  const branchName = (branches as Branch[]).find((b) => b.id === branchIdNum)?.name;

  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useHrUsers(branchIdNum);
  const updateHourlyRateMutation = useUpdateHourlyRate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [roleFilter, setRoleFilter] = useState<EmployeeRoleFilter>("ALL");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<EmploymentTypeFilter>("ALL");
  const [rateFilter, setRateFilter] = useState<EmployeeRateFilter>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");

  const employees = usersData ?? [];

  const filteredEmployees = useMemo(
    () =>
      filterEmployees(employees, {
        search: debouncedSearch,
        roleFilter,
        employmentTypeFilter,
        rateFilter,
      }),
    [employees, debouncedSearch, roleFilter, employmentTypeFilter, rateFilter],
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    roleFilter !== "ALL" ||
    employmentTypeFilter !== "ALL" ||
    rateFilter !== "ALL";

  const handleEditRate = useCallback((record: User) => {
    setSelectedUser(record);
    setHourlyRate(record.hourlyRate != null && record.hourlyRate > 0 ? String(record.hourlyRate) : "");
    setIsModalOpen(true);
  }, []);

  const handleUpdateSubmit = async () => {
    if (!selectedUser) return;
    const rate = Number(hourlyRate);
    if (Number.isNaN(rate) || rate < 0) {
      toast.error("Hourly rate is required");
      return;
    }
    try {
      await updateHourlyRateMutation.mutateAsync({ userId: selectedUser.id, hourlyRate: rate });
      toast.success("Hourly rate updated successfully");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update hourly rate"));
    }
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedUser(null);
  }, []);

  const columns = useMemo(
    () =>
      [
        {
          title: "Employee",
          key: "employee",
          render: (_: unknown, record: User) => (
            <div className="flex items-center gap-3">
              <Avatar className={hrAvatarClassName()}>{record.name?.charAt(0) || "U"}</Avatar>
              <div className="min-w-0">
                <div className={cn("font-bold truncate", text.primary)}>
                  {canLinkPayroll ? (
                    <Link href={buildHrPayrollUrl({ employee: record.id })} className={inlineLinkClassName()}>
                      {record.name || "Unknown User"}
                    </Link>
                  ) : (
                    record.name || "Unknown User"
                  )}
                </div>
                <div className={cn("text-xs truncate", tableCellMutedClassName())}>{record.email}</div>
              </div>
            </div>
          ),
        },
        {
          title: "Role",
          dataIndex: "role",
          key: "role",
          render: (roleText: string) => (
            <StatusBadge tone={employeeRoleTone(roleText)} className="font-bold">
              {roleText}
            </StatusBadge>
          ),
        },
        {
          title: "Type",
          dataIndex: "employmentType",
          key: "type",
          responsive: ["md"],
          render: (typeText: string) => (
            <span className={text.subtle}>
              {typeText ? typeText.replace("_", " ") : "Not set"}
            </span>
          ),
        },
        {
          title: "Branch",
          dataIndex: ["branch", "name"],
          key: "branch",
          responsive: ["lg"],
          render: (name: string) =>
            name ? (
              <StatusBadge tone="category">{name}</StatusBadge>
            ) : (
              <span className={text.muted}>HQ / All</span>
            ),
        },
        {
          title: "Hourly Rate",
          dataIndex: "hourlyRate",
          key: "rate",
          align: "right" as const,
          responsive: ["md"],
          render: (_: unknown, record: User) =>
            employeeHasMissingRate(record) ? (
              <StatusBadge tone="warning" className="tabular-nums font-bold">
                Not set
              </StatusBadge>
            ) : (
              <span className={cn("font-bold tabular-nums", metricValueClassName("emerald"))}>
                {formatBaht(record.hourlyRate)} / hr
              </span>
            ),
        },
        {
          title: "",
          key: "action",
          align: "right" as const,
          width: 72,
          render: (_: unknown, record: User) =>
            canEditCompensation ? (
              <TableActionButton
                icon={Edit3}
                label={`Edit rate for ${record.name ?? record.email}`}
                iconOnly
                onClick={() => handleEditRate(record)}
                className={tableActionAccentClassName("indigo")}
              />
            ) : null,
        },
      ] as ColumnsType<User>,
    [canEditCompensation, canLinkPayroll, handleEditRate],
  );

  const expandedRowRender = (record: User) => (
    <div className={expandedRowPanelClassName()}>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className={cn("text-xs font-medium uppercase tracking-wide", text.muted)}>Email</dt>
          <dd className={cn("mt-1", text.primary)}>{record.email}</dd>
        </div>
        <div>
          <dt className={cn("text-xs font-medium uppercase tracking-wide", text.muted)}>
            Employment type
          </dt>
          <dd className={cn("mt-1", text.primary)}>
            {record.employmentType?.replace("_", " ") ?? "Not set"}
          </dd>
        </div>
        <div>
          <dt className={cn("text-xs font-medium uppercase tracking-wide", text.muted)}>
            Base salary
          </dt>
          <dd className={cn("mt-1 tabular-nums font-bold", metricValueClassName("blue"))}>
            {record.baseSalary != null && record.baseSalary > 0
              ? formatBaht(record.baseSalary)
              : "—"}
          </dd>
        </div>
      </dl>
      {canLinkPayroll && (
        <div className="mt-4">
          <Link href={buildHrPayrollUrl({ employee: record.id })} className={inlineLinkClassName()}>
            View payroll for this employee
          </Link>
        </div>
      )}
    </div>
  );

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view the employee directory." />
    );
  }

  return (
    <>
      <HubPageHeader
        hideTitle
        icon={Users}
        accentHub="hr"
        actions={
          role === "SUPER_ADMIN" ? (
            <ButtonLink href="/organization/users" className={hubCtaClassName("hr", "font-bold")}>
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              Add user
            </ButtonLink>
          ) : undefined
        }
      />

      <HubListPage className={hrSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load employees") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, email, role…"
          branchName={branchName}
          showReset={hasActiveFilters}
          onReset={() => {
            setSearch("");
            setRoleFilter("ALL");
            setEmploymentTypeFilter("ALL");
            setRateFilter("ALL");
          }}
          filters={
            <>
              <ListFilterSelect
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as EmployeeRoleFilter)}
                ariaLabel="Filter by role"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All roles" },
                  { value: "SUPER_ADMIN", label: "Super Admin" },
                  { value: "MANAGER", label: "Manager" },
                  { value: "STAFF", label: "Staff" },
                ]}
              />
              <ListFilterSelect
                value={employmentTypeFilter}
                onValueChange={(value) => setEmploymentTypeFilter(value as EmploymentTypeFilter)}
                ariaLabel="Filter by employment type"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All types" },
                  { value: "FULL_TIME", label: "Full time" },
                  { value: "PART_TIME", label: "Part time" },
                ]}
              />
              <ListFilterSelect
                value={rateFilter}
                onValueChange={(value) => setRateFilter(value as EmployeeRateFilter)}
                ariaLabel="Filter by hourly rate"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All rates" },
                  { value: "missing-rate", label: "Missing rate" },
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
          filteredCount={filteredEmployees.length}
          totalCount={employees.length}
          itemLabel="employee"
          emptyLabel="No employees for this branch yet"
        />

        <DataTable
          columns={columns}
          dataSource={filteredEmployees}
          rowKey="id"
          loading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(error, "Failed to load employees")}
          onRetry={() => void refetch()}
          retryLoading={isFetching}
          emptyDescription={
            hasActiveFilters
              ? "No employees match your filters."
              : "No employees found for this branch."
          }
          pagination={{ pageSize: 15 }}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
        />
      </HubListPage>

      <EditCompensationModal
        open={isModalOpen}
        user={selectedUser}
        hourlyRate={hourlyRate}
        onHourlyRateChange={setHourlyRate}
        onClose={closeModal}
        onSubmit={() => void handleUpdateSubmit()}
        isSubmitting={updateHourlyRateMutation.isPending}
        canLinkPayroll={canLinkPayroll}
      />
    </>
  );
}
