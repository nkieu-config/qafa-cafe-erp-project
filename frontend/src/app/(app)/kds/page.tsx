"use client";

import { useMemo, useState } from "react";
import { AnimatedPage } from "@/components/animated-page";
import { HubPageHeader } from "@/components/shared/hub-card";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useKdsOrders, useUpdateKdsOrderStatus } from "@/hooks/domains/usePosQueries";
import { useKdsSocketSync } from "@/hooks/useKdsSocketSync";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Play, WifiOff, MonitorPlay, ChefHat, Loader2, RefreshCw } from "lucide-react";
import { OrderItem } from "@/types/api";
import { formatQueueNumber } from "@/lib/queue";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
  kdsConnectedBadgeClassName,
  kdsConnectedDotClassName,
  kdsDisconnectedBadgeClassName,
  kdsDoneButtonClassName,
  kdsEmptyStateClassName,
  kdsErrorBannerClassName,
  kdsErrorRetryClassName,
  kdsItemDividerClassName,
  kdsItemNoteClassName,
  kdsItemQtyClassName,
  kdsLoadingClassName,
  kdsStartButtonClassName,
  kdsTicketClassName,
  kdsTicketFooterClassName,
  kdsTicketGridClassName,
  kdsTicketHeaderClassName,
  type KdsTicketUrgency,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <div className={kdsConnectedBadgeClassName()}>
        <div className={kdsConnectedDotClassName()} aria-hidden="true" />
        Live Sync
      </div>
    );
  }

  return (
    <div className={kdsDisconnectedBadgeClassName()}>
      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
      Socket disconnected — polling every 30s
    </div>
  );
}

function ticketUrgency(waitMinutes: number): KdsTicketUrgency {
  if (waitMinutes >= 10) return "late";
  if (waitMinutes >= 5) return "warning";
  return "on-time";
}

function getWaitTimeMinutes(createdAt: string) {
  const diff = new Date().getTime() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

export default function KdsPage() {
  const { activeBranchId } = useAuth();
  const { isConnected } = useSocket();
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useKdsOrders(activeBranchId ?? undefined, isConnected);

  const updateStatusMutation = useUpdateKdsOrderStatus(activeBranchId ?? undefined);
  useKdsSocketSync(activeBranchId ?? undefined);

  const queueStats = useMemo(() => {
    let late = 0;
    let preparing = 0;
    for (const order of orders) {
      if (order.status === "PREPARING") preparing += 1;
      if (getWaitTimeMinutes(order.createdAt) >= 10) late += 1;
    }
    return { total: orders.length, late, preparing };
  }, [orders]);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update order status"));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!activeBranchId) {
    return (
      <AnimatedPage className="h-full flex flex-col space-y-4">
        <HubPageHeader
          title="Kitchen Display System (KDS)"
          icon={MonitorPlay}
          description="Real-time order queue"
          hideTitle
        />
        <BranchEmptyState description="Select a branch in the top bar to view the kitchen display." />
      </AnimatedPage>
    );
  }

  const fetchError = isError ? getErrorMessage(error, "Failed to load kitchen orders") : null;

  return (
    <AnimatedPage className="h-full flex flex-col gap-4 min-h-0">
      <HubPageHeader
        title="Kitchen Display System (KDS)"
        icon={MonitorPlay}
        description="Real-time order queue"
        hideTitle
        actions={<ConnectionBadge isConnected={isConnected} />}
      />

      {!isLoading && orders.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={cn("font-semibold tabular-nums", text.primary)}>
            {queueStats.total} order{queueStats.total === 1 ? "" : "s"} in queue
          </span>
          {queueStats.preparing > 0 && (
            <span className={text.muted}>
              {queueStats.preparing} preparing
            </span>
          )}
          {queueStats.late > 0 && (
            <span className="font-medium text-[var(--status-danger-fg)]">
              {queueStats.late} overdue (10+ min)
            </span>
          )}
        </div>
      )}

      {fetchError && (
        <div className={kdsErrorBannerClassName()}>
          <p className={`text-sm font-medium ${text.primary}`}>{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className={kdsErrorRetryClassName()}
            onClick={() => void refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
            <Loader2 className={`w-10 h-10 animate-spin motion-reduce:animate-none ${kdsLoadingClassName()}`} aria-hidden="true" />
            <span className="sr-only">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className={kdsEmptyStateClassName()}>
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-[var(--kds-empty-icon)]" />
            <p className={`font-semibold ${text.primary}`}>No pending orders</p>
            <p className={`text-sm mt-2 ${text.muted}`}>Kitchen is clear — new orders will appear here automatically.</p>
          </div>
        ) : (
          <div className={kdsTicketGridClassName()}>
            {orders.map((order) => {
              const waitTime = getWaitTimeMinutes(order.createdAt);
              const urgency = ticketUrgency(waitTime);
              const isUpdating = updatingOrderId === order.id;

              return (
                <div key={order.id} className={kdsTicketClassName(urgency)}>
                  <div className={kdsTicketHeaderClassName(urgency)}>
                    <div>
                      <div className="font-black text-3xl sm:text-4xl tracking-wider tabular-nums">#{formatQueueNumber(order.queueNumber)}</div>
                      <div className="text-xs opacity-80 font-mono mt-0.5">Order ref {order.id}</div>
                      <div className="text-sm opacity-90 font-medium flex items-center gap-2 mt-1">
                        {order.status === "PREPARING" ? "กำลังทำ (Preparing)" : "รอคิว (Pending)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-lg sm:text-xl font-bold bg-black/20 px-3 py-2 rounded-lg shadow-inner">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                      {waitTime} min
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 min-h-0">
                    {order.items?.map((item: OrderItem) => (
                      <div key={item.id} className={kdsItemDividerClassName()}>
                        <div className="flex gap-3 items-start">
                          <span className={kdsItemQtyClassName()}>{item.quantity}x</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`${text.primary} font-black text-xl sm:text-2xl leading-tight`}>{item.product?.name}</span>
                            {item.notes && (
                              <div className={kdsItemNoteClassName()}>
                                + {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={kdsTicketFooterClassName()}>
                    {order.status === "PENDING" && (
                      <Button
                        className={kdsStartButtonClassName()}
                        onClick={() => void handleUpdateStatus(order.id, "PREPARING")}
                        disabled={isUpdating}
                      >
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 mr-2" /> START
                      </Button>
                    )}
                    <Button
                      className={kdsDoneButtonClassName()}
                      onClick={() => void handleUpdateStatus(order.id, "COMPLETED")}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mr-2" /> DONE
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
