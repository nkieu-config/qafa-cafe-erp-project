"use client";

import { useMemo, useState } from "react";
import { AnimatedPage } from "@/components/layout/animated-page";
import { KdsOrderBoard } from "@/components/kds/KdsOrderBoard";
import {
  KdsConnectionBadge,
  KdsImmersiveHeader,
} from "@/components/kds/KdsImmersiveChrome";
import type { KdsPendingAction } from "@/components/kds/KdsOrderTicket";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { QueryLoadingPanel } from "@/components/shared/query-states";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useKdsOrders, useUpdateKdsOrderStatus } from "@/hooks/domains/usePosQueries";
import { useKdsSocketSync } from "@/hooks/useKdsSocketSync";
import { useKdsWaitClock } from "@/hooks/useKdsWaitClock";
import { getWaitTimeMinutes } from "@/lib/kds-display";
import { ChefHat } from "lucide-react";
import { formatQueueNumber } from "@/lib/queue";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
  kdsEmptyIconClassName,
  kdsEmptyStateClassName,
} from "@/lib/theme/immersive";
import { text } from "@/lib/theme/surface";
import { typeUiLabelClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";

export default function KdsPage() {
  const { activeBranchId } = useAuth();
  const { isConnected } = useSocket();
  const now = useKdsWaitClock();
  const [pendingAction, setPendingAction] = useState<KdsPendingAction | null>(null);
  const [confirmDoneId, setConfirmDoneId] = useState<number | null>(null);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useKdsOrders(activeBranchId ?? undefined, isConnected);

  const updateStatusMutation = useUpdateKdsOrderStatus(activeBranchId ?? undefined);
  useKdsSocketSync(activeBranchId ?? undefined);

  const queueStats = useMemo(() => {
    let late = 0;
    let preparing = 0;
    for (const order of orders) {
      if (order.status === "PREPARING") preparing += 1;
      if (getWaitTimeMinutes(order.createdAt, now) >= 10) late += 1;
    }
    return { total: orders.length, late, preparing };
  }, [orders, now]);

  const handleUpdateStatus = async (
    orderId: number,
    status: KdsPendingAction["status"],
  ) => {
    setPendingAction({ orderId, status });
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update order status"));
    } finally {
      setPendingAction(null);
    }
  };

  const handleStart = (orderId: number) => {
    void handleUpdateStatus(orderId, "PREPARING");
  };

  const handleRequestDone = (orderId: number) => {
    setConfirmDoneId(orderId);
  };

  const handleCancelDone = () => {
    setConfirmDoneId(null);
  };

  const handleConfirmDone = async (order: Order) => {
    const queueLabel = formatQueueNumber(order.queueNumber);
    setConfirmDoneId(null);
    setPendingAction({ orderId: order.id, status: "COMPLETED" });
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.id, status: "COMPLETED" });
      toast.success(`Order #${queueLabel} completed`, {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            void handleUpdateStatus(order.id, "PREPARING");
          },
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to complete order"));
    } finally {
      setPendingAction(null);
    }
  };

  if (!activeBranchId) {
    return (
      <AnimatedPage className="flex h-full flex-col">
        <BranchEmptyState title="Select a branch for KDS" />
      </AnimatedPage>
    );
  }

  const fetchError = isError ? getErrorMessage(error, "Failed to load kitchen orders") : null;

  return (
    <AnimatedPage className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
      <KdsImmersiveHeader
        isConnected={isConnected}
        queueStats={queueStats}
        isLoading={isLoading}
      />

      {fetchError && (
        <QueryErrorBanner
          message={fetchError}
          onRetry={() => void refetch()}
          loading={isFetching}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <QueryLoadingPanel message="Loading orders…" variant="kds" minHeightClassName="min-h-[16rem]" />
        ) : orders.length === 0 && !isError ? (
          <div className={kdsEmptyStateClassName()}>
            <ChefHat className={kdsEmptyIconClassName("mx-auto mb-4 h-12 w-12")} aria-hidden />
            <p className={typeUiLabelClassName(text.primary)}>No pending orders</p>
            <p className={cn("mt-2 text-sm", text.muted)}>
              Kitchen is clear — new orders will appear here automatically.
            </p>
            <div className="mt-4 flex justify-center">
              <KdsConnectionBadge isConnected={isConnected} />
            </div>
          </div>
        ) : !isError ? (
          <KdsOrderBoard
            orders={orders}
            now={now}
            pendingAction={pendingAction}
            confirmDoneId={confirmDoneId}
            onStart={handleStart}
            onRequestDone={handleRequestDone}
            onCancelDone={handleCancelDone}
            onConfirmDone={handleConfirmDone}
          />
        ) : null}
      </div>
    </AnimatedPage>
  );
}
