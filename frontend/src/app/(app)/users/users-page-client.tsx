"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import {
  Building,
  Mail,
  Pencil,
  Plus,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useHrUsers, useCreateUser, useUpdateUser } from "@/hooks/domains/useHrQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AnimatedPage } from "@/components/animated-page";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { AccessDeniedState } from "@/components/shared/access-denied-state";
import { DataTable } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, roleTone } from "@/components/shared/status-badge";
import { RoleGuard } from "@/components/RoleGuard";
import { UserFormModal } from "@/components/organization/UserFormModal";
import { Button } from "@/components/ui/button";
import {
  type EmployeeRateFilter,
  type EmployeeRoleFilter,
  type EmploymentTypeFilter,
  type OrgUserBranchFilter,
  employmentTypeLabel,
  filterEmployees,
  roleLabel,
  summarizeEmployees,
} from "@/lib/employee-filters";
import { getErrorMessage } from "@/lib/errors";
import type {
  Branch,
  CreateUserPayload,
  EmploymentType,
  Role,
  User,
} from "@/types/api";
import {
  avatarPlaceholderClassName,
  hubCtaClassName,
  inlineLinkClassName,
  organizationSectionPanelClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function UsersPageClient({ embedded = false }: { embedded?: boolean }) {
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersQueryError,
    refetch: refetchUsers,
    isFetching: usersFetching,
  } = useHrUsers();
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesQueryError,
    refetch: refetchBranches,
    isFetching: branchesFetching,
  } = useBranches();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [roleFilter, setRoleFilter] = useState<EmployeeRoleFilter>("ALL");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<EmploymentTypeFilter>("ALL");
  const [rateFilter, setRateFilter] = useState<EmployeeRateFilter>("ALL");
  const [branchFilter, setBranchFilter] = useState<OrgUserBranchFilter>("ALL");

  const branchList = (branches as Branch[] | undefined) ?? [];
  const userList = (users as User[] | undefined) ?? [];

  const branchNameById = useMemo(
    () => new Map(branchList.map((branch) => [branch.id, branch.name])),
    [branchList],
  );

  const summary = useMemo(() => summarizeEmployees(userList), [userList]);

  const filteredUsers = useMemo(
    () =>
      filterEmployees(userList, {
        search: debouncedSearch,
        roleFilter,
        employmentTypeFilter,
        rateFilter,
        branchFilter,
        branchNames: branchNameById,
      }),
    [
      userList,
      debouncedSearch,
      roleFilter,
      employmentTypeFilter,
      rateFilter,
      branchFilter,
      branchNameById,
    ],
  );

  const isLoading = usersLoading || branchesLoading;
  const isError = usersError || branchesError;
  const error = usersQueryError ?? branchesQueryError;
  const isFetching = usersFetching || branchesFetching;

  const hasActiveFilters =
    search.trim().length > 0 ||
    roleFilter !== "ALL" ||
    employmentTypeFilter !== "ALL" ||
    rateFilter !== "ALL" ||
    branchFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setEmploymentTypeFilter("ALL");
    setRateFilter("ALL");
    setBranchFilter("ALL");
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    branchId: number | null;
    employmentType: EmploymentType;
    hourlyRate: number;
    baseSalary: number;
  }) => {
    try {
      const body: CreateUserPayload = {
        ...payload,
        branchId: payload.branchId,
      };
      if (!body.password) delete body.password;

      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, ...body });
        toast.success("User updated");
      } else {
        if (!payload.password) {
          toast.error("Password is required for new users");
          return;
        }
        await createMutation.mutateAsync({ ...body, password: payload.password });
        toast.success("User created");
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save user"));
      throw err;
    }
  };

  const columns = useMemo(
    () =>
      [
        {
          title: "User",
          key: "user",
          render: (_: unknown, record: User) => (
            <div className="flex items-center gap-3 min-w-0">
              <div className={avatarPlaceholderClassName()}>
                <UserIcon className={cn("w-4 h-4", text.muted)} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className={cn("font-medium truncate", text.primary)}>
                  {record.name || "Unnamed user"}
                </div>
                <div className={cn("text-xs flex items-center gap-1 truncate", text.muted)}>
                  <Mail className="w-3 h-3 shrink-0" aria-hidden />
                  {record.email}
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "Role",
          dataIndex: "role",
          key: "role",
          render: (role: Role) => (
            <StatusBadge tone={roleTone(role)}>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3 h-3" aria-hidden />
                {roleLabel(role)}
              </span>
            </StatusBadge>
          ),
        },
        {
          title: "Branch",
          key: "branch",
          responsive: ["md"],
          render: (_: unknown, record: User) => {
            const label =
              record.branchId == null
                ? "All branches (HQ)"
                : branchNameById.get(record.branchId) ??
                  record.branch?.name ??
                  `Branch #${record.branchId}`;
            return (
              <div className={cn("flex items-center gap-1.5 min-w-0", text.secondary)}>
                <Building className={cn("w-4 h-4 shrink-0", text.muted)} aria-hidden />
                <span className="truncate">{label}</span>
              </div>
            );
          },
        },
        {
          title: "Employment",
          key: "employment",
          responsive: ["lg"],
          render: (_: unknown, record: User) => (
            <span className={text.secondary}>{employmentTypeLabel(record.employmentType)}</span>
          ),
        },
        {
          title: "Actions",
          key: "actions",
          align: "right",
          width: 100,
          render: (_: unknown, record: User) => (
            <TableActionButton
              label="Edit"
              icon={Pencil}
              tone="blue"
              onClick={() => handleEdit(record)}
            />
          ),
        },
      ] satisfies ColumnsType<User>,
    [branchNameById],
  );

  const content = (
    <div className={cn("space-y-6 w-full", embedded ? "max-w-6xl" : "max-w-6xl mx-auto")}>
      <HubPageHeader
        hideTitle
        accentHub="organization"
        actions={
          <Button
            className={hubCtaClassName("organization", "font-bold min-h-[44px]")}
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Add user
          </Button>
        }
      />

      <HubListPage className={organizationSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load users.") : undefined}
          onRetry={() => {
            void refetchUsers();
            void refetchBranches();
          }}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, email, role, branch…"
          showReset={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <>
              <ListFilterSelect
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as EmployeeRoleFilter)}
                ariaLabel="Filter by role"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All roles" },
                  { value: "SUPER_ADMIN", label: "Super Admin" },
                  { value: "MANAGER", label: "Manager" },
                  { value: "STAFF", label: "Staff" },
                ]}
              />
              <ListFilterSelect
                value={
                  branchFilter === "ALL"
                    ? "ALL"
                    : branchFilter === "hq"
                      ? "hq"
                      : String(branchFilter)
                }
                onValueChange={(value) => {
                  if (value === "ALL") setBranchFilter("ALL");
                  else if (value === "hq") setBranchFilter("hq");
                  else setBranchFilter(Number(value));
                }}
                ariaLabel="Filter by branch"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All branches" },
                  { value: "hq", label: "HQ / unassigned" },
                  ...branchList.map((branch) => ({
                    value: String(branch.id),
                    label: branch.name,
                  })),
                ]}
              />
              <ListFilterSelect
                value={employmentTypeFilter}
                onValueChange={(value) => setEmploymentTypeFilter(value as EmploymentTypeFilter)}
                ariaLabel="Filter by employment type"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All types" },
                  { value: "FULL_TIME", label: "Full-time" },
                  { value: "PART_TIME", label: "Part-time" },
                ]}
              />
              <ListFilterSelect
                value={rateFilter}
                onValueChange={(value) => setRateFilter(value as EmployeeRateFilter)}
                ariaLabel="Filter by hourly rate"
                widthClassName="w-full sm:w-[160px]"
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
          filteredCount={filteredUsers.length}
          totalCount={userList.length}
          itemLabel="user"
          emptyLabel="No users yet"
          actions={
            <Link
              href="/hr/employees"
              className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
            >
              <UserIcon className="w-3.5 h-3.5" aria-hidden />
              Employee directory
            </Link>
          }
        />

        <DataTable
          loading={isLoading}
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          emptyDescription={
            hasActiveFilters
              ? "No users match your filters."
              : "Add your first user to grant system access."
          }
        />
      </HubListPage>

      <UserFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        branches={branchList}
        onSubmit={handleSave}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );

  if (embedded) return content;

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN"]}
      fallback={
        <AccessDeniedState description="Super Admin access is required to manage users and roles." />
      }
    >
      <AnimatedPage className="space-y-6 max-w-6xl mx-auto w-full">{content}</AnimatedPage>
    </RoleGuard>
  );
}
