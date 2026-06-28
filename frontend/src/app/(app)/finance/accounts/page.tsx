"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { seedAccounts } from "@/lib/api";
import { BookOpen, Landmark, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge, accountTypeTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/domains/useAccountingQueries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { groupAccountsByType } from "@/lib/accounts";
import {
  type AccountActiveFilter,
  type AccountTypeFilter,
  accountTypeLabel,
  accountTypesForLegend,
  filterAccountTree,
  summarizeAccounts,
} from "@/lib/account-filters";
import { getErrorMessage } from "@/lib/errors";
import type { AccountTableRow } from "@/types/api";
import {
  financeHubIconClassName,
  financeSectionPanelClassName,
  financeSectionTitleClassName,
  hubCtaClassName,
  infoBannerClassName,
  infoBannerIconClassName,
  infoBannerTextClassName,
  infoBannerTitleClassName,
  inlineLinkClassName,
  tableCellMutedClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function ChartOfAccountsPage() {
  const {
    data: accountsData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAccounts();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<AccountActiveFilter>("ALL");
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const accountsTree = useMemo(() => groupAccountsByType(accountsData), [accountsData]);
  const summary = useMemo(() => summarizeAccounts(accountsData), [accountsData]);

  const filteredTree = useMemo(
    () =>
      filterAccountTree(accountsTree, {
        search: debouncedSearch,
        typeFilter,
        activeFilter,
      }),
    [accountsTree, debouncedSearch, typeFilter, activeFilter],
  );

  const hasActiveFilters =
    search.trim().length > 0 || typeFilter !== "ALL" || activeFilter !== "ALL";
  const showSeedAction = accountsData.length === 0 && !isLoading && !isError;
  const filteredAccountCount = filteredTree.reduce(
    (count, group) => count + group.children.length,
    0,
  );

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedAccounts();
      toast.success("Chart of accounts seeded");
      setShowSeedConfirm(false);
      void refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to seed accounts"));
    } finally {
      setIsSeeding(false);
    }
  };

  const columns = useMemo(
    () =>
      [
        {
          title: "Code",
          dataIndex: "code",
          key: "code",
          width: 150,
          render: (code: string, record: AccountTableRow) =>
            "isGroup" in record && record.isGroup ? (
              <span className={cn("font-semibold uppercase tracking-wide", text.primary)}>
                {accountTypeLabel(record.type)}
              </span>
            ) : (
              <span className="font-mono font-medium tabular-nums">{code}</span>
            ),
        },
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
          render: (name: string, record: AccountTableRow) =>
            "isGroup" in record && record.isGroup ? (
              <span className={cn("font-bold", text.primary)}>{name}</span>
            ) : (
              <span className={text.secondary}>{name}</span>
            ),
        },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          width: 150,
          responsive: ["md"],
          render: (type: string, record: AccountTableRow) => {
            if ("isGroup" in record && record.isGroup) return null;
            return (
              <StatusBadge tone={accountTypeTone(type)}>{accountTypeLabel(type)}</StatusBadge>
            );
          },
        },
        {
          title: "Description",
          dataIndex: "description",
          key: "description",
          responsive: ["lg"],
          render: (description: string | null | undefined, record: AccountTableRow) => {
            if ("isGroup" in record && record.isGroup) return null;
            return description?.trim() ? (
              <span className={cn("line-clamp-2 text-sm", text.subtle)}>{description}</span>
            ) : (
              <span className={text.muted}>—</span>
            );
          },
        },
        {
          title: "Status",
          dataIndex: "isActive",
          key: "isActive",
          width: 110,
          render: (isActive: boolean, record: AccountTableRow) => {
            if ("isGroup" in record && record.isGroup) {
              return (
                <span className={cn("text-xs tabular-nums", text.muted)}>
                  {record.children.length} account{record.children.length === 1 ? "" : "s"}
                </span>
              );
            }
            return isActive ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Inactive</StatusBadge>
            );
          },
        },
      ] as ColumnsType<AccountTableRow>,
    [],
  );

  return (
    <>
      <div className="space-y-6">
        <HubPageHeader
          hideTitle
          icon={Landmark}
          accentHub="finance"
          actions={
            showSeedAction ? (
              <Button
                className={hubCtaClassName("finance", "font-bold")}
                disabled={isSeeding}
                onClick={() => setShowSeedConfirm(true)}
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
                    Seeding…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" aria-hidden />
                    Seed accounts
                  </>
                )}
              </Button>
            ) : undefined
          }
        />

        <HubListPage className={financeSectionPanelClassName()}>
          {showSeedAction && (
            <HubListPage.Banner>
              <div className={infoBannerClassName()}>
                <div className="flex items-start gap-3">
                  <Landmark className={infoBannerIconClassName()} aria-hidden />
                  <div>
                    <p className={infoBannerTitleClassName()}>No chart of accounts yet</p>
                    <p className={infoBannerTextClassName()}>
                      Seed standard accounting codes to enable journal posting, or open the{" "}
                      <Link href="/finance/ledger" className={inlineLinkClassName()}>
                        general ledger
                      </Link>{" "}
                      after seeding.
                    </p>
                  </div>
                </div>
              </div>
            </HubListPage.Banner>
          )}

          <HubListPage.Error
            message={isError ? getErrorMessage(error, "Failed to load chart of accounts") : undefined}
            onRetry={() => void refetch()}
            loading={isFetching}
          />

          <HubListPage.Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search code, name, description…"
            showReset={hasActiveFilters}
            onReset={() => {
              setSearch("");
              setTypeFilter("ALL");
              setActiveFilter("ALL");
            }}
            filters={
              <>
                <ListFilterSelect
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as AccountTypeFilter)}
                  ariaLabel="Filter by account type"
                  widthClassName="w-full sm:w-[160px]"
                  options={[
                    { value: "ALL", label: "All types" },
                    ...accountTypesForLegend().map((type) => ({
                      value: type,
                      label: accountTypeLabel(type),
                    })),
                  ]}
                />
                <ListFilterSelect
                  value={activeFilter}
                  onValueChange={(value) => setActiveFilter(value as AccountActiveFilter)}
                  ariaLabel="Filter by account status"
                  widthClassName="w-full sm:w-[160px]"
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "active", label: "Active only" },
                    { value: "inactive", label: "Inactive only" },
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
            filteredCount={filteredAccountCount}
            totalCount={summary.total}
            itemLabel="account"
            emptyLabel="No accounts yet"
            actions={
              <Link
                href="/finance/ledger"
                className={cn("inline-flex items-center gap-1 text-sm font-medium", inlineLinkClassName())}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden />
                General ledger
              </Link>
            }
          />

          <div className={financeSectionPanelClassName("border border-[var(--table-container-border)] bg-[var(--table-container-bg)]")}>
            <h2 className={financeSectionTitleClassName()}>
              <Landmark className={financeHubIconClassName()} aria-hidden />
              Account hierarchy
            </h2>
            <DataTable
              columns={columns}
              dataSource={filteredTree}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              defaultExpandAllRows
              emptyDescription={
                hasActiveFilters
                  ? "No accounts match the current filters."
                  : showSeedAction
                    ? "Seed the chart of accounts to get started."
                    : "No accounts found."
              }
            />
            {!isLoading && filteredTree.length > 0 && (
              <p className={cn("mt-3 text-xs", tableCellMutedClassName())}>
                Accounts are grouped by type. Expand or collapse sections using the row controls.
              </p>
            )}
          </div>
        </HubListPage>
      </div>

      <ConfirmDialog
        open={showSeedConfirm}
        onOpenChange={setShowSeedConfirm}
        title="Initialize chart of accounts?"
        description="This seeds standard accounting codes required for journal posting. Existing accounts are not removed."
        confirmLabel="Seed accounts"
        loading={isSeeding}
        onConfirm={handleSeed}
      />
    </>
  );
}
