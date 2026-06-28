"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranchOrders, useVoidOrder, useRefundOrder } from "@/hooks/domains/usePosQueries";
import { HubCard } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { ListFilterSelect } from "@/components/shared/list-filters";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableActionButton } from "@/components/shared/table-action-button";
import { StatusBadge, orderStatusTone } from "@/components/shared/status-badge";
import { Receipt, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatBaht } from "@/lib/money";
import { formatQueueNumber } from "@/lib/queue";
import type { Order, OrderStatus, Branch } from "@/types/api";
import { formatDateTime } from "@/lib/intl-date";
import { getErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { posQueueHighlightClassName, tableCellMutedClassName, text } from "@/lib/theme";
import { cn } from "@/lib/utils";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isTerminal(status: OrderStatus) {
  return status === "CANCELLED" || status === "REFUNDED";
}

const LOOKBACK_DAYS = 14;
const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default function PosOrdersPage() {
  const { activeBranchId, user } = useAuth();
  const { data: branches = [] } = useBranches();
  const branchId = activeBranchId ? Number(activeBranchId) : undefined;
  const branchName = (branches as Branch[]).find((b) => b.id === branchId)?.name;
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useBranchOrders(branchId);
  const voidMutation = useVoidOrder();
  const refundMutation = useRefundOrder();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);

  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const recentOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
    return [...orders]
      .filter((o: Order) => new Date(o.createdAt) >= cutoff)
      .sort(
        (a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return recentOrders.filter((o) => {
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      if (!debouncedSearch) return matchesStatus;
      const haystack = [
        String(o.id),
        o.status,
        o.paymentMethod ?? "",
        formatQueueNumber(o.queueNumber),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && haystack.includes(debouncedSearch);
    });
  }, [recentOrders, debouncedSearch, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const handleVoid = async (orderId: number) => {
    try {
      await voidMutation.mutateAsync(orderId);
      toast.success(`Order #${orderId} voided — stock and ledger reversed`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to void order");
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      await refundMutation.mutateAsync({
        orderId: refundTarget.id,
        reason: refundReason.trim() || undefined,
      });
      toast.success(`Order #${refundTarget.id} refunded`);
      setRefundTarget(null);
      setRefundReason("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to refund order");
    }
  };

  if (!branchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view orders and refunds." />
    );
  }

  return (
    <>
      <HubCard
        title="Orders & Refunds"
        hideTitle
        description="Void same-day orders or refund completed sales from previous days."
      >
        <HubListPage>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load orders") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Toolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by order #, queue, status…"
          branchName={branchName}
          showReset={hasActiveFilters}
          onReset={handleResetFilters}
          filters={
            <ListFilterSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | "ALL")}
              ariaLabel="Filter by status"
              options={[
                { value: "ALL", label: "All statuses" },
                ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
              ]}
            />
          }
        />
        <DataTable
          loading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(error, "Failed to load orders")}
          onRetry={() => void refetch()}
          retryLoading={isFetching}
          rowKey="id"
          dataSource={filteredOrders}
          emptyDescription={
            hasActiveFilters
              ? "No orders match your filters."
              : "No orders in the last 14 days."
          }
          expandable={{
            expandedRowRender: (row: Order) => (
              <ul className="py-2 space-y-2 text-sm">
                {(row.items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--table-row-border)] pb-2 last:border-0"
                  >
                    <div>
                      <span className={text.primary}>
                        {item.product?.name ?? `Product #${item.productId}`}
                      </span>
                      {item.notes && (
                        <span className={cn("block text-xs", text.muted)}>{item.notes}</span>
                      )}
                      {item.modifiers?.map((mod) => (
                        <span key={mod.id} className={cn("block text-xs", text.muted)}>
                          {mod.optionName}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono tabular-nums shrink-0">
                      {item.quantity} × {formatBaht(item.price)}
                    </span>
                  </li>
                ))}
                {(row.items?.length ?? 0) === 0 && (
                  <li className={text.muted}>No line items returned for this order.</li>
                )}
              </ul>
            ),
            rowExpandable: (row) => (row.items?.length ?? 0) > 0,
          }}
          columns={[
            {
              title: "Queue",
              dataIndex: "queueNumber",
              key: "queue",
              render: (n: number | null) => (
                <span className={posQueueHighlightClassName()}>
                  {formatQueueNumber(n)}
                </span>
              ),
            },
            {
              title: "Order #",
              dataIndex: "id",
              key: "id",
              render: (id: number) => (
                <span className={cn("font-mono", tableCellMutedClassName())}>#{id}</span>
              ),
            },
            {
              title: "Date",
              dataIndex: "createdAt",
              key: "date",
              render: (v: string) => formatDateTime(v),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status: OrderStatus) => (
                <StatusBadge tone={orderStatusTone(status)}>{status}</StatusBadge>
              ),
            },
            {
              title: "Payment",
              dataIndex: "paymentMethod",
              key: "payment",
              render: (v: string) => v?.replace("_", " ") ?? "-",
            },
            {
              title: "Net",
              dataIndex: "netAmount",
              key: "net",
              align: "right" as const,
              render: (v: number | string) => (
                <span className="font-mono font-bold tabular-nums">{formatBaht(v)}</span>
              ),
            },
            {
              title: "Items",
              key: "items",
              render: (_: unknown, row: Order) => row.items?.length ?? 0,
            },
            {
              title: "Actions",
              key: "actions",
              align: "right" as const,
              render: (_: unknown, row: Order) => {
                if (!canManage || isTerminal(row.status)) return null;

                if (isToday(row.createdAt)) {
                  return (
                    <TableActionButton
                      icon={Ban}
                      label="Void"
                      destructive
                      onClick={() => setVoidTarget(row)}
                    />
                  );
                }

                if (row.status === "COMPLETED") {
                  return (
                    <TableActionButton
                      icon={RotateCcw}
                      label="Refund"
                      tone="amber"
                      onClick={() => {
                        setRefundTarget(row);
                        setRefundReason("");
                      }}
                    />
                  );
                }

                return null;
              },
            },
          ]}
        />
        </HubListPage>
      </HubCard>

      <ConfirmDialog
        open={voidTarget !== null}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        title={voidTarget ? `Void order #${voidTarget.id}?` : "Void order?"}
        description="Same-day cancel — restores stock and reverses GL."
        confirmLabel="Void"
        destructive
        loading={voidMutation.isPending}
        onConfirm={async () => {
          if (voidTarget) await handleVoid(voidTarget.id);
        }}
      />

      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null);
            setRefundReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund order #{refundTarget?.id}</DialogTitle>
            <DialogDescription>
              Posts a refund journal entry and restores inventory for this
              completed sale from a previous day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="refund-reason">Reason (optional)</Label>
            <Input
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Customer complaint, wrong item, etc."
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full min-h-[44px]"
              disabled={refundMutation.isPending}
              onClick={() => void handleRefund()}
            >
              Confirm refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
