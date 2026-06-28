"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Form, Select, InputNumber } from "antd";
import { CheckCircle2, ArrowRightLeft, ExternalLink, Building2 } from "lucide-react";
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
import { ListToolbar } from "@/components/shared/list-toolbar";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import {
  compactPanelLinkClassName,
  formLineRowClassName,
  hubInfoActionClassName,
  metricValueClassName,
  procurementHubIconClassName,
  text,
} from "@/lib/theme";
import type { Branch, Ingredient, StockTransfer } from "@/types/api";

type SourceInventory = { ingredient: Ingredient; stock: number };

export type StockTransfersPanelHandle = {
  openCreate: () => void;
};

interface StockTransfersPanelProps {
  /** @deprecated Use `variant` instead */
  mode?: "full" | "compact";
  /** `page` — inside HubCard (no extra chrome). `compact` — inventory widget with local header. */
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

export const StockTransfersPanel = forwardRef<
  StockTransfersPanelHandle,
  StockTransfersPanelProps
>(function StockTransfersPanel({ mode, variant: variantProp, sourceInventories }, ref) {
  const variant = variantProp ?? (mode === "compact" ? "compact" : "page");

  const { user, activeBranchId } = useAuth();
  const branchId = activeBranchId ?? undefined;

  const { data: transfersData, isLoading: loadingTransfers, isError: transfersError, error: transfersErr, refetch: refetchTransfers, isFetching: transfersFetching } = useTransfers(branchId);
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
  const [form] = Form.useForm();

  const loading = loadingTransfers || loadingBranches || loadingIng;

  const branchName = branches.find((b: Branch) => b.id === branchId)?.name;

  const searchParams = useSearchParams();
  const pendingFromUrl = searchParams.get("status") === "PENDING";
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING">(
    pendingFromUrl ? "PENDING" : "ALL",
  );

  useEffect(() => {
    if (searchParams.get("status") === "PENDING") setStatusFilter("PENDING");
  }, [searchParams]);

  const visibleTransfers = useMemo(() => {
    const base =
      variant === "page"
        ? transfers
        : !branchId
          ? transfers.filter((t) => t.status === "PENDING")
          : transfers.filter(
              (t) =>
                t.status === "PENDING" &&
                (t.toBranchId === branchId || t.fromBranchId === branchId),
            );

    if (variant !== "page" || statusFilter !== "PENDING") return base;
    return base.filter((t) => t.status === "PENDING");
  }, [transfers, variant, branchId, statusFilter]);

  const canAccept = useCallback(
    (transfer: StockTransfer) => {
      if (transfer.status !== "PENDING") return false;
      if (user?.role === "SUPER_ADMIN") return true;
      return !!branchId && transfer.toBranchId === branchId;
    },
    [user?.role, branchId],
  );

  const ingredientOptions = useMemo(() => {
    if (sourceInventories?.length) {
      return sourceInventories
        .filter((i) => i.stock > 0)
        .map((i) => ({
          value: i.ingredient.id,
          label: `${i.ingredient.name} (max ${i.stock} ${i.ingredient.unit})`,
        }));
    }
    return allIngredients.map((i: Ingredient) => ({
      value: i.id,
      label: `${i.name} (${i.unit})`,
    }));
  }, [sourceInventories, allIngredients]);

  const openCreate = useCallback(() => {
    form.resetFields();
    if (branchId) {
      form.setFieldsValue({ fromBranchId: branchId });
    }
    setIsModalOpen(true);
  }, [form, branchId]);

  useImperativeHandle(ref, () => ({ openCreate }), [openCreate]);

  const handleCreateSubmit = async (values: {
    fromBranchId?: number;
    toBranchId: number;
    ingredientId: number;
    quantity: number;
  }) => {
    const fromBranchId = branchId ?? values.fromBranchId;
    if (!fromBranchId) {
      toast.error("Select a source branch");
      return;
    }
    if (fromBranchId === values.toBranchId) {
      toast.error("Source and destination must differ");
      return;
    }

    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        fromBranchId,
        toBranchId: values.toBranchId,
        ingredientId: values.ingredientId,
        quantity: values.quantity,
      });
      toast.success("Transfer requested");
      setIsModalOpen(false);
      form.resetFields();
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

  const columns = useMemo(
    () => [
      {
        title: "Date",
        dataIndex: "createdAt",
        key: "createdAt",
        width: variant === "compact" ? 120 : 160,
        render: (date: string) => (
          <span className={`whitespace-nowrap tabular-nums ${text.subtle}`}>
            {variant === "compact"
              ? formatDateTime(date)
              : formatDateTime(date)}
          </span>
        ),
      },
      {
        title: "From",
        key: "from",
        render: (_: unknown, record: StockTransfer) => (
          <BranchCell name={record.fromBranch?.name} />
        ),
      },
      {
        title: "To",
        key: "to",
        render: (_: unknown, record: StockTransfer) => (
          <BranchCell name={record.toBranch?.name} />
        ),
      },
      {
        title: "Ingredient",
        key: "ingredient",
        render: (_: unknown, record: StockTransfer) => (
          <span className={`font-medium ${text.primary}`}>
            {record.ingredient?.name ?? "—"}
          </span>
        ),
      },
      {
        title: "Qty",
        key: "quantity",
        align: "right" as const,
        width: 100,
        render: (_: unknown, record: StockTransfer) => (
          <span className={`font-mono tabular-nums ${text.subtle}`}>
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
              render: (_: unknown, record: StockTransfer) => (
                <span className={text.muted}>
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
        width: 120,
        render: (status: string) => (
          <StatusBadge tone={transferStatusTone(status)}>{status}</StatusBadge>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "right" as const,
        width: 140,
        render: (_: unknown, record: StockTransfer) => {
          if (canAccept(record)) {
            return (
              <TableActionButton
                icon={CheckCircle2}
                label="Accept"
                onClick={() => setAcceptTarget(record)}
                className={`font-bold ${metricValueClassName("emerald")}`}
              />
            );
          }
          if (
            record.status === "PENDING" &&
            branchId &&
            record.fromBranchId === branchId
          ) {
            return (
              <span className={`text-xs italic ${text.muted}`}>
                Awaiting {record.toBranch?.name ?? "destination"}
              </span>
            );
          }
          return null;
        },
      },
    ],
    [variant, canAccept, branchId],
  );

  const emptyDescription =
    variant === "page"
      ? "No stock transfers yet. Request a transfer to move inventory between branches."
      : "No pending transfers for this branch.";

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
      loading={loading}
      isError={transfersError}
      errorMessage={getErrorMessage(transfersErr, "Failed to load stock transfers")}
      onRetry={() => void refetchTransfers()}
      retryLoading={transfersFetching}
      hideBorders={variant === "page"}
      emptyDescription={emptyDescription}
      scroll={{ x: variant === "page" ? 960 : 720 }}
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
              <ArrowRightLeft className={procurementHubIconClassName()} aria-hidden />
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
        <div className="space-y-4">
          <ListToolbar
            branchName={branchName}
            filters={
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING")}
                className="min-h-[44px] rounded-md border px-3 text-sm border-[var(--border)] bg-[var(--table-container-bg)] text-[var(--foreground)]"
                aria-label="Filter transfers by status"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending incoming</option>
              </select>
            }
          />
          {table}
        </div>
      )}

      <FormModal
        title="Request Stock Transfer"
        icon={ArrowRightLeft}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="mt-6"
        >
          {!branchId && (
            <Form.Item
              label="From branch (source)"
              name="fromBranchId"
              rules={[{ required: true, message: "Source branch is required" }]}
            >
              <Select
                showSearch
                placeholder="Select source branch"
                options={branches.map((b: Branch) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            </Form.Item>
          )}

          {branchId && (
            <p className={`mb-4 text-sm rounded-lg px-3 py-2 ${formLineRowClassName("items-stretch")}`}>
              Transferring from{" "}
              <span className={`font-medium ${text.secondary}`}>
                {branches.find((b: Branch) => b.id === branchId)?.name ?? "selected branch"}
              </span>
            </p>
          )}

          <Form.Item
            label="To branch (destination)"
            name="toBranchId"
            rules={[{ required: true, message: "Destination branch is required" }]}
          >
            <Select
              showSearch
              placeholder="Select destination branch"
              options={branches
                .filter((b: Branch) => b.id !== branchId)
                .map((b: Branch) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>

          <Form.Item
            label="Ingredient"
            name="ingredientId"
            rules={[{ required: true, message: "Ingredient is required" }]}
          >
            <Select
              showSearch
              placeholder="Select ingredient"
              options={ingredientOptions}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Quantity is required" }]}
          >
            <InputNumber min={0.1} step={0.1} className="w-full" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-8">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className={hubInfoActionClassName()}
              disabled={submitting}
              onClick={() => form.submit()}
            >
              {submitting ? "Requesting…" : "Request Transfer"}
            </Button>
          </div>
        </Form>
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
