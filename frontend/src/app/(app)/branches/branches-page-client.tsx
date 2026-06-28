"use client";

import { useMemo, useState } from "react";
import { Building2, Loader2, MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBranches, useCreateBranch, useUpdateBranch } from "@/hooks/domains/useGeneralQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AnimatedPage } from "@/components/animated-page";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { BranchFormModal } from "@/components/organization/BranchFormModal";
import { Button } from "@/components/ui/button";
import {
  type BranchTypeFilter,
  branchTypeLabel,
  filterBranches,
  summarizeBranches,
} from "@/lib/branch-filters";
import { getErrorMessage } from "@/lib/errors";
import type { Branch } from "@/types/api";
import {
  branchCardAccentClassName,
  branchCardClassName,
  branchCardMetaClassName,
  emptyStatePanelClassName,
  hubCtaClassName,
  hubLoadingSpinnerClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  metricValueClassName,
  organizationSectionPanelClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function BranchesPageClient({ embedded = false }: { embedded?: boolean }) {
  const {
    data: branches,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [typeFilter, setTypeFilter] = useState<BranchTypeFilter>("ALL");

  const branchList = (branches as Branch[] | undefined) ?? [];
  const summary = useMemo(() => summarizeBranches(branchList), [branchList]);

  const filteredBranches = useMemo(
    () =>
      filterBranches(branchList, {
        typeFilter,
        search: debouncedSearch,
      }),
    [branchList, typeFilter, debouncedSearch],
  );

  const hasActiveFilters = search.trim().length > 0 || typeFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    location?: string;
    isCentralKitchen?: boolean;
  }) => {
    try {
      if (editingBranch) {
        await updateMutation.mutateAsync({ id: editingBranch.id, ...payload });
        toast.success("Branch updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Branch created");
      }
      setIsModalOpen(false);
      setEditingBranch(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save branch"));
      throw err;
    }
  };

  const content = (
    <div className={cn("space-y-6 w-full", embedded ? "max-w-5xl" : "max-w-5xl mx-auto")}>
      <HubPageHeader
        hideTitle
        accentHub="organization"
        actions={
          <Button
            className={hubCtaClassName("organization", "font-bold min-h-[44px]")}
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Add branch
          </Button>
        }
      />

      <HubListPage className={organizationSectionPanelClassName()}>
        {!isLoading && !isError && summary.total === 0 && (
          <HubListPage.Banner>
            <div className={infoBannerClassName()}>
              <div className="flex items-start gap-3">
                <Building2 className={infoBannerIconClassName()} aria-hidden />
                <div>
                  <p className={infoBannerTitleClassName()}>No branches yet</p>
                  <p className={infoBannerTextClassName()}>
                    Create your first branch or central kitchen, then assign users in{" "}
                    <span className="font-medium">Users &amp; Roles</span> and stock in Inventory.
                  </p>
                </div>
              </div>
            </div>
          </HubListPage.Banner>
        )}

        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load branches.") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, location, ID…"
          showReset={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <ListFilterSelect
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as BranchTypeFilter)}
              ariaLabel="Filter by branch type"
              widthClassName="w-full sm:w-[180px]"
              options={[
                { value: "ALL", label: "All types" },
                { value: "central", label: "Central kitchen" },
                { value: "franchise", label: "Franchise" },
              ]}
            />
          }
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredBranches.length}
          totalCount={branchList.length}
          itemLabel="branch"
        />

        <HubListPage.Body>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className={cn("w-8 h-8", hubLoadingSpinnerClassName())} aria-hidden />
            <span className="sr-only">Loading branches</span>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className={emptyStatePanelClassName()}>
            <Building2
              className={cn("w-12 h-12 mx-auto mb-4", metricValueClassName("slate"))}
              aria-hidden
            />
            <p className={cn("font-semibold", text.primary)}>
              {hasActiveFilters ? "No branches match your filters" : "No branches yet"}
            </p>
            <p className={cn("text-sm mt-2 max-w-md mx-auto", text.muted)}>
              {hasActiveFilters
                ? "Try clearing search or type filters."
                : "Create your first branch or central kitchen to start assigning staff and inventory."}
            </p>
            {!hasActiveFilters && (
              <Button
                className={hubCtaClassName("organization", "mt-6 min-h-[44px] font-bold")}
                onClick={handleAddNew}
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden />
                Add first branch
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredBranches.map((branch) => (
              <article
                key={branch.id}
                className={branchCardClassName(
                  "organization",
                  branchCardAccentClassName(branch.isCentralKitchen),
                )}
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className={cn("font-bold text-lg truncate", text.primary)}>
                      {branch.name}
                    </h3>
                    <p className={cn("text-sm flex items-center gap-1 mt-1", text.muted)}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {branch.location?.trim() || "No location specified"}
                      </span>
                    </p>
                  </div>
                  <StatusBadge tone={branch.isCentralKitchen ? "warning" : "neutral"}>
                    {branchTypeLabel(branch.isCentralKitchen)}
                  </StatusBadge>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--table-row-border)] flex justify-between items-center gap-2">
                  <span className={branchCardMetaClassName()}>ID #{branch.id}</span>
                  <TableActionButton
                    label="Edit"
                    icon={Pencil}
                    tone="blue"
                    onClick={() => handleEdit(branch)}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
        </HubListPage.Body>
      </HubListPage>

      <BranchFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBranch(null);
        }}
        branch={editingBranch}
        onSubmit={handleSave}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );

  if (embedded) return content;

  return <AnimatedPage className="space-y-6 max-w-5xl mx-auto w-full">{content}</AnimatedPage>;
}
