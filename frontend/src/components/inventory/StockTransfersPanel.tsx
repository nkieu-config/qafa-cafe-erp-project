"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRightLeft,
  ExternalLink,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/intl-date";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { useIngredients } from "@/hooks/domains/useProductionQueries";
import {
  useTransfers,
  useCreateTransfer,
  useAcceptTransfer,
} from "@/hooks/domains/useTransferQueries";
import { FormModal } from "@/components/shared/form-modal";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, transferStatusTone } from "@/components/shared/status-badge";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterRow, ListFilterSelect } from "@/components/shared/list-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/errors";
import { formatHubListCountWithFetching } from "@/lib/format-hub-list-count";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  compactPanelLinkClassName,
  formFieldInsetClassName,
  formSelectContentClassName,
  formSourceBannerClassName,
  hubCtaClassName,
  inventoryHubIconClassName,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Branch, Ingredient, StockTransfer } from "@/types/api";
import type { ColumnsType } from "antd/es/table";

type SourceInventory = { ingredient: Ingredient; stock: number };

type CreateTransferForm = {
  fromBranchId: number;
  toBranchId: number;
  ingredientId: number;
  quantity: string;
};

type StatusFilter = "ALL" | "PENDING";
type DirectionFilter = "ALL" | "incoming" | "outgoing";

const emptyCreateForm = (): CreateTransferForm => ({
  fromBranchId: 0,
  toBranchId: 0,
  ingredientId: 0,
  quantity: "",
});

function parseStatusFilter(param: string | null): StatusFilter {
  return param === "PENDING" ? "PENDING" : "ALL";
}

function parseDirectionFilter(param: string | null): DirectionFilter {
  if (param === "incoming" || param === "outgoing") return param;
  return "ALL";
}

export type StockTransfersPanelHandle = {
  openCreate: () => void;
};

interface StockTransfersPanelProps {
  /** @deprecated Use `variant` instead */
  mode?: "full" | "compact";
  /** `page` — full transfers tab. `compact` — overview widget. */
  variant?: "page" | "compact";
  /** When compact, limit ingredient picker to branch stock on hand. */
  sourceInventories?: SourceInventory[];
}

function branchLabel(name: string | undefined) {
  return name?.trim() || "—";
}

function BranchCell({ name }: { name: string | undefined }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${text.secondary}`}>
      <Building2 className={`w-3.5 h-3.5 shrink-0 ${text.muted}`} aria-hidden />
      <span className="font-medium">{branchLabel(name)}</span>
    </span>
  );
}

function transferMatchesSearch(transfer: StockTransfer, query: string) {
  const ingredient = transfer.ingredient?.name?.toLowerCase() ?? "";
  const from = transfer.fromBranch?.name?.toLowerCase() ?? "";
  const to = transfer.toBranch?.name?.toLowerCase() ?? "";
  const requester = (
    transfer.requestedBy?.name ??
    transfer.requestedBy?.email ??
    ""
  ).toLowerCase();
  return (
    ingredient.includes(query) ||
    from.includes(query) ||
    to.includes(query) ||
    requester.includes(query)
  );
}

export const StockTransfersPanel = forwardRef<
  StockTransfersPanelHandle,
  StockTransfersPanelProps
>(function StockTransfersPanel({ mode, variant: variantProp, sourceInventories }, ref) {
  const variant = variantProp ?? (mode === "compact" ? "compact" : "page");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, activeBranchId } = useAuth();
  const branchId = activeBranchId ?? undefined;

  const {
    data: transfersData,
    isLoading: loadingTransfers,
    isError: transfersError,
    error: transfersErr,
    refetch: refetchTransfers,
    isFetching: transfersFetching,
  } = useTransfers(branchId);
  const { data: branchesData, isLoading: loadingBranches } = useBranches();
  const { data: ingredientsData, isLoading: loadingIng } = useIngredients();

  const transfers = (transfersData as StockTransfer[]) || [];
  const branches = branchesData || [];
  const allIngredients = ingredientsData || [];

  const createMutation = useCreateTransfer();
  const acceptMutation = useAcceptTransfer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<StockTransfer | null>(null);
  const [createForm, setCreateForm] = useState<CreateTransferForm>(emptyCreateForm);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get("status")),
  );
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>(() =>
    parseDirectionFilter(searchParams.get("direction")),
  );

  const modalFormLoading = loadingBranches || loadingIng;

  useEffect(() => {
    setStatusFilter(parseStatusFilter(searchParams.get("status")));
    setDirectionFilter(parseDirectionFilter(searchParams.get("direction")));
  }, [searchParams]);

  const syncUrlFilters = useCallback(
    (status: StatusFilter, direction: DirectionFilter) => {
      const params = new URLSearchParams();
      if (status === "PENDING") params.set("status", "PENDING");
      if (direction !== "ALL") params.set("direction", direction);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const handleStatusFilterChange = useCallback(
    (value: StatusFilter) => {
      setStatusFilter(value);
      syncUrlFilters(value, directionFilter);
    },
    [directionFilter, syncUrlFilters],
  );

  const handleDirectionFilterChange = useCallback(
    (value: DirectionFilter) => {
      setDirectionFilter(value);
      syncUrlFilters(statusFilter, value);
    },
    [statusFilter, syncUrlFilters],
  );

  const transferSummary = useMemo(() => {
    let pending = 0;
    let incoming = 0;
    let outgoing = 0;
    for (const transfer of transfers) {
      if (transfer.status !== "PENDING") continue;
      pending += 1;
      if (branchId && transfer.toBranchId === branchId) incoming += 1;
      if (branchId && transfer.fromBranchId === branchId) outgoing += 1;
    }
    return { total: transfers.length, pending, incoming, outgoing };
  }, [transfers, branchId]);

  const visibleTransfers = useMemo(() => {
    let base =
      variant === "page"
        ? transfers
        : !branchId
          ? transfers.filter((t) => t.status === "PENDING")
          : transfers.filter(
              (t) =>
                t.status === "PENDING" &&
                (t.toBranchId === branchId || t.fromBranchId === branchId),
            );

    if (variant === "page") {
      if (statusFilter === "PENDING") {
        base = base.filter((t) => t.status === "PENDING");
      }
      if (directionFilter === "incoming" && branchId) {
        base = base.filter((t) => t.toBranchId === branchId);
      }
      if (directionFilter === "outgoing" && branchId) {
        base = base.filter((t) => t.fromBranchId === branchId);
      }
      if (debouncedSearch) {
        base = base.filter((t) => transferMatchesSearch(t, debouncedSearch));
      }
    }

    return base;
  }, [transfers, variant, branchId, statusFilter, directionFilter, debouncedSearch]);

  const hasActiveFilters =
    variant === "page" &&
    (search.trim().length > 0 || statusFilter !== "ALL" || directionFilter !== "ALL");

  const canAccept = useCallback(
    (transfer: StockTransfer) => {
      if (transfer.status !== "PENDING") return false;
      if (user?.role === "SUPER_ADMIN") return true;
      return !!branchId && transfer.toBranchId === branchId;
    },
    [user?.role, branchId],
  );

  const ingredientOptions = useMemo((): { id: number; label: string }[] => {
    if (sourceInventories?.length) {
      return sourceInventories
        .filter((i) => i.stock > 0)
        .map((i) => ({
          id: i.ingredient.id,
          label: `${i.ingredient.name} (max ${i.stock} ${i.ingredient.unit})`,
        }));
    }
    return allIngredients.map((i: Ingredient) => ({
      id: i.id,
      label: `${i.name} (${i.unit})`,
    }));
  }, [sourceInventories, allIngredients]);

  const destinationBranches = useMemo(
    () => branches.filter((b: Branch) => b.id !== branchId),
    [branches, branchId],
  );

  const openCreate = useCallback(() => {
    setCreateForm({
      ...emptyCreateForm(),
      fromBranchId: branchId ?? 0,
    });
    setIsModalOpen(true);
  }, [branchId]);

  useImperativeHandle(ref, () => ({ openCreate }), [openCreate]);

  const handleCreateSubmit = async () => {
    const fromBranchId = branchId ?? createForm.fromBranchId;
    const toBranchId = createForm.toBranchId;
    const ingredientId = createForm.ingredientId;
    const quantity = Number(createForm.quantity);

    if (!fromBranchId) {
      toast.error("Select a source branch");
      return;
    }
    if (!toBranchId) {
      toast.error("Select a destination branch");
      return;
    }
    if (fromBranchId === toBranchId) {
      toast.error("Source and destination must differ");
      return;
    }
    if (!ingredientId) {
      toast.error("Select an ingredient");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Enter a quantity greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        fromBranchId,
        toBranchId,
        ingredientId,
        quantity,
      });
      toast.success("Transfer requested");
      setIsModalOpen(false);
      setCreateForm(emptyCreateForm());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (transferId: number) => {
    try {
      await acceptMutation.mutateAsync(transferId);
      toast.success("Transfer accepted — inventory updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept transfer");
    }
  };

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setDirectionFilter("ALL");
    syncUrlFilters("ALL", "ALL");
  }, [syncUrlFilters]);

  const columns = useMemo(
    () =>
      [
      {
        title: "Date",
        dataIndex: "createdAt",
        key: "createdAt",
        width: variant === "compact" ? 120 : 140,
        responsive: ["md"],
        render: (date: string) => (
          <span className={`whitespace-nowrap tabular-nums text-sm ${text.subtle}`}>
            {formatDateTime(date)}
          </span>
        ),
      },
      {
        title: "From",
        key: "from",
        responsive: ["md"],
        render: (_: unknown, record: StockTransfer) => (
          <BranchCell name={record.fromBranch?.name} />
        ),
      },
      {
        title: "To",
        key: "to",
        responsive: ["md"],
        render: (_: unknown, record: StockTransfer) => (
          <BranchCell name={record.toBranch?.name} />
        ),
      },
      {
        title: "Ingredient",
        key: "ingredient",
        render: (_: unknown, record: StockTransfer) => (
          <div className="min-w-0">
            <span className={`font-medium ${text.primary}`}>
              {record.ingredient?.name ?? "—"}
            </span>
            <p className={`mt-0.5 text-xs md:hidden ${text.muted}`}>
              {branchLabel(record.fromBranch?.name)} → {branchLabel(record.toBranch?.name)}
            </p>
          </div>
        ),
      },
      {
        title: "Qty",
        key: "quantity",
        align: "right" as const,
        width: 88,
        render: (_: unknown, record: StockTransfer) => (
          <span className={`font-mono tabular-nums text-sm ${text.subtle}`}>
            {record.quantity}
            {record.ingredient?.unit ? (
              <span className={`ml-1 text-xs ${text.muted}`}>{record.ingredient.unit}</span>
            ) : null}
          </span>
        ),
      },
      ...(variant === "page"
        ? [
            {
              title: "Requested by",
              key: "requestedBy",
              responsive: ["lg"],
              render: (_: unknown, record: StockTransfer) => (
                <span className={`text-sm ${text.muted}`}>
                  {record.requestedBy?.name ?? record.requestedBy?.email ?? "—"}
                </span>
              ),
            },
          ]
        : []),
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: variant === "page" ? 148 : 110,
        render: (status: string, record: StockTransfer) => (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge tone={transferStatusTone(status)}>{status}</StatusBadge>
            {status === "PENDING" && branchId && record.toBranchId === branchId ? (
              <StatusBadge tone="info" className="inline-flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3" aria-hidden />
                Incoming
              </StatusBadge>
            ) : null}
            {status === "PENDING" && branchId && record.fromBranchId === branchId ? (
              <StatusBadge tone="warning" className="inline-flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" aria-hidden />
                Awaiting {record.toBranch?.name ?? "destination"}
              </StatusBadge>
            ) : null}
          </div>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "right" as const,
        width: 120,
        render: (_: unknown, record: StockTransfer) => {
          if (canAccept(record)) {
            return (
              <TableActionButton
                icon={CheckCircle2}
                label="Accept"
                tone="emerald"
                onClick={() => setAcceptTarget(record)}
              />
            );
          }
          return null;
        },
      },
      ] as ColumnsType<StockTransfer>,
    [variant, canAccept, branchId],
  );

  const emptyDescription = useMemo(() => {
    if (variant === "compact") return "No pending transfers for this branch.";
    if (hasActiveFilters) return "No transfers match your filters.";
    if (transfers.length === 0) {
      return "No stock transfers yet. Request a transfer to move inventory between branches.";
    }
    return "No transfers match your filters.";
  }, [variant, hasActiveFilters, transfers.length]);

  if (variant === "page" && !branchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to request and manage stock transfers." />
    );
  }

  const table = (
    <DataTable
      columns={columns}
      dataSource={visibleTransfers}
      rowKey="id"
      loading={loadingTransfers}
      isError={transfersError}
      errorMessage={getErrorMessage(transfersErr, "Failed to load stock transfers")}
      onRetry={() => void refetchTransfers()}
      retryLoading={transfersFetching}
      hideBorders={variant === "page"}
      emptyDescription={emptyDescription}
      scroll={variant === "compact" ? { x: 720 } : { x: undefined }}
      pagination={
        variant === "page"
          ? { pageSize: 15, showSizeChanger: true, pageSizeOptions: ["10", "15", "25", "50"] }
          : { pageSize: 5, hideOnSinglePage: true }
      }
    />
  );

  return (
    <>
      {variant === "compact" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className={`font-semibold text-lg flex items-center gap-2 ${text.primary}`}>
              <ArrowRightLeft className={inventoryHubIconClassName()} aria-hidden />
              Pending Transfers
            </h2>
            <div className="flex gap-2">
              {branchId && (
                <Button variant="outline" size="sm" onClick={openCreate}>
                  New transfer
                </Button>
              )}
              <Link
                href="/inventory/transfers"
                className={compactPanelLinkClassName()}
              >
                All transfers <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>
          {table}
        </div>
      )}

      {variant === "page" && (
        <HubListPage>
          <HubListPage.Error
            message={
              transfersError
                ? getErrorMessage(transfersErr, "Failed to load stock transfers")
                : undefined
            }
            onRetry={() => void refetchTransfers()}
            loading={transfersFetching}
          />

          <HubListPage.Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search ingredient, branch, or requester…"
            showReset={hasActiveFilters}
            onReset={resetFilters}
            filters={
              <ListFilterRow>
                <ListFilterSelect
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}
                  ariaLabel="Filter transfers by status"
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "PENDING", label: "Pending only" },
                  ]}
                />
                <ListFilterSelect
                  value={directionFilter}
                  onValueChange={handleDirectionFilterChange}
                  ariaLabel="Filter transfers by direction"
                  options={[
                    { value: "ALL", label: "All directions" },
                    { value: "incoming", label: "Incoming" },
                    { value: "outgoing", label: "Outgoing" },
                  ]}
                />
              </ListFilterRow>
            }
          />

          <HubListPage.Count
            isLoading={loadingTransfers}
            isError={transfersError}
            isFetching={transfersFetching}
            hasActiveFilters={hasActiveFilters}
            filteredCount={visibleTransfers.length}
            totalCount={transferSummary.total}
            itemLabel="transfer"
          >
            {formatHubListCountWithFetching(
              (() => {
                if (hasActiveFilters) {
                  return `${visibleTransfers.length} of ${transferSummary.total} transfer${transferSummary.total === 1 ? "" : "s"}`;
                }
                if (transferSummary.total === 0) return "No transfers yet";
                const parts = [
                  `${transferSummary.total} transfer${transferSummary.total === 1 ? "" : "s"}`,
                ];
                if (transferSummary.pending > 0) {
                  parts.push(`${transferSummary.pending} pending`);
                }
                if (transferSummary.incoming > 0) {
                  parts.push(`${transferSummary.incoming} incoming`);
                }
                if (transferSummary.outgoing > 0) {
                  parts.push(`${transferSummary.outgoing} outgoing`);
                }
                return parts.join(" · ");
              })(),
              transfersFetching,
              loadingTransfers,
            )}
          </HubListPage.Count>

          <HubListPage.Body>{table}</HubListPage.Body>
        </HubListPage>
      )}

      <FormModal
        title="Request Stock Transfer"
        icon={ArrowRightLeft}
        iconClassName={inventoryHubIconClassName()}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCreateForm(emptyCreateForm());
        }}
        width={520}
      >
        <div className="space-y-4">
          {!branchId && (
            <div className="space-y-2">
              <Label htmlFor="transfer-from-branch" className={text.secondary}>
                From branch (source)
              </Label>
              <Select
                value={createForm.fromBranchId === 0 ? "" : String(createForm.fromBranchId)}
                onValueChange={(value) => {
                  if (value == null) return;
                  setCreateForm((prev) => ({ ...prev, fromBranchId: Number(value) }));
                }}
                disabled={modalFormLoading}
              >
                <SelectTrigger
                  id="transfer-from-branch"
                  className={formFieldInsetClassName("h-11 w-full")}
                >
                  <SelectValue
                    placeholder={modalFormLoading ? "Loading branches…" : "Select source branch"}
                  />
                </SelectTrigger>
                <SelectContent className={formSelectContentClassName()}>
                  {branches.map((b: Branch) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {branchId && (
            <p className={cn(formSourceBannerClassName(), text.secondary)}>
              Transferring from{" "}
              <span className={`font-medium ${text.primary}`}>
                {branches.find((b: Branch) => b.id === branchId)?.name ?? "selected branch"}
              </span>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="transfer-to-branch" className={text.secondary}>
              To branch (destination)
            </Label>
            <Select
              value={createForm.toBranchId === 0 ? "" : String(createForm.toBranchId)}
              onValueChange={(value) => {
                if (value == null) return;
                setCreateForm((prev) => ({ ...prev, toBranchId: Number(value) }));
              }}
              disabled={modalFormLoading}
            >
              <SelectTrigger id="transfer-to-branch" className={formFieldInsetClassName("h-11 w-full")}>
                <SelectValue
                  placeholder={
                    modalFormLoading ? "Loading branches…" : "Select destination branch"
                  }
                />
              </SelectTrigger>
              <SelectContent className={formSelectContentClassName()}>
                {destinationBranches.map((b: Branch) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-ingredient" className={text.secondary}>
              Ingredient
            </Label>
            <Select
              value={createForm.ingredientId === 0 ? "" : String(createForm.ingredientId)}
              onValueChange={(value) => {
                if (value == null) return;
                setCreateForm((prev) => ({ ...prev, ingredientId: Number(value) }));
              }}
              disabled={modalFormLoading}
            >
              <SelectTrigger id="transfer-ingredient" className={formFieldInsetClassName("h-11 w-full")}>
                <SelectValue
                  placeholder={modalFormLoading ? "Loading ingredients…" : "Select ingredient"}
                />
              </SelectTrigger>
              <SelectContent className={formSelectContentClassName()}>
                {ingredientOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-quantity" className={text.secondary}>
              Quantity
            </Label>
            <Input
              id="transfer-quantity"
              type="number"
              min="0.1"
              step="0.1"
              className={formFieldInsetClassName("h-11")}
              value={createForm.quantity}
              disabled={modalFormLoading}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className={hubCtaClassName("inventory")}
              disabled={submitting || modalFormLoading}
              onClick={() => void handleCreateSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                  Requesting…
                </>
              ) : (
                "Request Transfer"
              )}
            </Button>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={acceptTarget !== null}
        onOpenChange={(open) => !open && setAcceptTarget(null)}
        title={
          acceptTarget
            ? `Accept transfer to ${acceptTarget.toBranch?.name ?? "branch"}?`
            : "Accept transfer?"
        }
        description={
          acceptTarget
            ? `${acceptTarget.quantity} ${acceptTarget.ingredient?.unit ?? "units"} of ${acceptTarget.ingredient?.name ?? "ingredient"} will be moved into your branch inventory.`
            : undefined
        }
        confirmLabel="Accept"
        loading={acceptMutation.isPending}
        onConfirm={async () => {
          if (acceptTarget) await handleAccept(acceptTarget.id);
        }}
      />
    </>
  );
});

StockTransfersPanel.displayName = "StockTransfersPanel";
