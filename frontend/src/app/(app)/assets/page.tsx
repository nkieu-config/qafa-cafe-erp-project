"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { AlertTriangle, Loader2, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateEquipment,
  useEquipment,
  useLogMaintenance,
} from "@/hooks/domains/useProcurementQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge, equipmentStatusTone } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { RegisterEquipmentModal } from "@/components/assets/RegisterEquipmentModal";
import { LogMaintenanceModal } from "@/components/assets/LogMaintenanceModal";
import { Button } from "@/components/ui/button";
import {
  EQUIPMENT_TYPE_OPTIONS,
  type EquipmentHighlightFilter,
  type EquipmentStatusFilter,
  type EquipmentTypeFilter,
  equipmentStatusLabel,
  equipmentTypeLabel,
  filterEquipment,
  isMaintenanceDueSoon,
  isMaintenanceOverdue,
  summarizeEquipment,
} from "@/lib/equipment-filters";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/intl-date";
import type { Branch, Equipment, EquipmentStatus, EquipmentType } from "@/types/api";
import {
  assetsSectionPanelClassName,
  equipmentMaintenanceDateClassName,
  equipmentMaintenanceDueRowClassName,
  equipmentMaintenanceOverdueRowClassName,
  hubCtaClassName,
  hubLoadingSpinnerClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const { user, activeBranchId } = useAuth();
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;

  const { data: branches = [] } = useBranches();
  const branchName = (branches as Branch[]).find((branch) => branch.id === branchIdNum)?.name;

  const {
    data: equipmentData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEquipment(branchIdNum);
  const createMutation = useCreateEquipment();
  const maintMutation = useLogMaintenance();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<EquipmentTypeFilter>("ALL");
  const [highlightFilter, setHighlightFilter] = useState<EquipmentHighlightFilter>("ALL");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Equipment | null>(null);

  const equipmentList = equipmentData ?? [];

  const summary = useMemo(() => summarizeEquipment(equipmentList), [equipmentList]);

  const filteredEquipment = useMemo(
    () =>
      filterEquipment(equipmentList, {
        statusFilter,
        typeFilter,
        highlightFilter,
        search: debouncedSearch,
      }),
    [equipmentList, statusFilter, typeFilter, highlightFilter, debouncedSearch],
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    highlightFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setHighlightFilter("ALL");
  };

  const handleCreate = async (payload: {
    branchId: number;
    name: string;
    type: EquipmentType;
    serialNumber?: string;
    nextMaintenanceDate?: string;
  }) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Equipment registered");
      setRegisterOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to register equipment"));
      throw err;
    }
  };

  const handleLogMaintenance = async (payload: {
    id: number;
    data: {
      description: string;
      cost: number;
      performedBy?: string;
      date: string;
      nextMaintenanceDate?: string;
      newStatus?: EquipmentStatus;
    };
  }) => {
    try {
      await maintMutation.mutateAsync(payload);
      toast.success("Maintenance logged");
      setMaintenanceTarget(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to log maintenance"));
      throw err;
    }
  };

  const columns = useMemo(
    () =>
      [
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
          render: (name: string, record: Equipment) => (
            <div className="min-w-0">
              <span className={cn("font-medium block truncate", text.primary)}>{name}</span>
              {record.serialNumber && (
                <span className={cn("text-xs block truncate", tableCellMutedClassName())}>
                  S/N {record.serialNumber}
                </span>
              )}
            </div>
          ),
        },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          render: (type: EquipmentType) => equipmentTypeLabel(type),
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          render: (status: EquipmentStatus) => (
            <StatusBadge tone={equipmentStatusTone(status)}>
              {equipmentStatusLabel(status)}
            </StatusBadge>
          ),
        },
        {
          title: "Next maintenance",
          dataIndex: "nextMaintenanceDate",
          key: "nextMaintenanceDate",
          render: (date: string | null | undefined) => {
            if (!date) {
              return <span className={tableCellMutedClassName()}>—</span>;
            }
            const overdue = isMaintenanceOverdue(date);
            const dueSoon = isMaintenanceDueSoon(date);
            return (
              <span className={equipmentMaintenanceDateClassName(overdue, dueSoon)}>
                {formatDate(date)}
                {overdue && " · overdue"}
                {!overdue && dueSoon && " · due soon"}
              </span>
            );
          },
        },
        {
          title: "Actions",
          key: "actions",
          width: 120,
          render: (_: unknown, record: Equipment) => (
            <TableActionButton
              label="Log maintenance"
              icon={Wrench}
              tone="amber"
              onClick={() => setMaintenanceTarget(record)}
            />
          ),
        },
      ] satisfies ColumnsType<Equipment>,
    [],
  );

  const rowClassName = (record: Equipment) => {
    if (record.status !== "ACTIVE" || !record.nextMaintenanceDate) return "";
    if (isMaintenanceOverdue(record.nextMaintenanceDate)) {
      return equipmentMaintenanceOverdueRowClassName();
    }
    if (isMaintenanceDueSoon(record.nextMaintenanceDate)) {
      return equipmentMaintenanceDueRowClassName();
    }
    return "";
  };

  if (!branchIdNum) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to manage equipment." />
    );
  }

  return (
    <div className="space-y-6">
      <HubPageHeader
        hideTitle
        accentHub="assets"
        actions={
          <Button
            className={hubCtaClassName("assets", "font-bold min-h-[44px]")}
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Register equipment
          </Button>
        }
      />

      <HubListPage className={assetsSectionPanelClassName()}>
        {!isLoading && !isError && summary.dueSoon > 0 && (
          <HubListPage.Banner>
            <div className={infoBannerClassName()}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={infoBannerIconClassName()} aria-hidden />
                <div>
                  <p className={infoBannerTitleClassName()}>Maintenance attention needed</p>
                  <p className={infoBannerTextClassName()}>
                    {summary.dueSoon} active asset{summary.dueSoon === 1 ? " is" : "s are"} overdue
                    or due within 7 days. Schedule service to avoid downtime.
                  </p>
                </div>
              </div>
            </div>
          </HubListPage.Banner>
        )}

        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load equipment.") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, serial, type…"
          branchName={branchName}
          showReset={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <>
              <ListFilterSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as EquipmentStatusFilter)}
                ariaLabel="Filter by status"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "MAINTENANCE", label: "In maintenance" },
                  { value: "BROKEN", label: "Broken" },
                  { value: "RETIRED", label: "Retired" },
                ]}
              />
              <ListFilterSelect
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as EquipmentTypeFilter)}
                ariaLabel="Filter by type"
                widthClassName="w-full sm:w-[180px]"
                options={[
                  { value: "ALL", label: "All types" },
                  ...EQUIPMENT_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
              />
              <ListFilterSelect
                value={highlightFilter}
                onValueChange={(value) => setHighlightFilter(value as EquipmentHighlightFilter)}
                ariaLabel="Filter by maintenance schedule"
                widthClassName="w-full sm:w-[160px]"
                options={[
                  { value: "ALL", label: "All schedules" },
                  { value: "due-soon", label: "Due within 7 days" },
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
          filteredCount={filteredEquipment.length}
          totalCount={summary.total}
          itemLabel="asset"
          emptyLabel="No equipment yet"
        />

        <HubListPage.Body>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className={cn("w-8 h-8", hubLoadingSpinnerClassName())} aria-hidden />
            <span className="sr-only">Loading equipment</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            dataSource={filteredEquipment}
            rowKey="id"
            rowClassName={rowClassName}
            emptyDescription={
              hasActiveFilters
                ? "No equipment matches your filters."
                : "Register your first asset to start tracking maintenance."
            }
          />
        )}
        </HubListPage.Body>
      </HubListPage>

      <RegisterEquipmentModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        branchId={branchIdNum}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <LogMaintenanceModal
        open={maintenanceTarget != null}
        onClose={() => setMaintenanceTarget(null)}
        equipment={maintenanceTarget}
        performedBy={user?.name ?? user?.email ?? undefined}
        onSubmit={handleLogMaintenance}
        isSubmitting={maintMutation.isPending}
      />
    </div>
  );
}
