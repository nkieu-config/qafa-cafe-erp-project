"use client";

import { useMemo, useState } from "react";
import { AnimatedPage } from "@/components/animated-page";
import {
  KdsConnectionBadge,
  KdsImmersiveHeader,
} from "@/components/kds/KdsImmersiveChrome";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useKdsOrders, useUpdateKdsOrderStatus } from "@/hooks/domains/usePosQueries";
import { useKdsSocketSync } from "@/hooks/useKdsSocketSync";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Play, ChefHat, Loader2, RefreshCw } from "lucide-react";
import { OrderItem } from "@/types/api";
import { formatQueueNumber } from "@/lib/queue";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
  kdsDoneButtonClassName,
  kdsEmptyStateClassName,
  kdsErrorBannerClassName,
  kdsErrorRetryClassName,
  kdsItemDividerClassName,
  kdsItemModifierClassName,
  kdsItemNoteClassName,
  kdsItemQtyClassName,
  kdsLoadingClassName,
  kdsStartButtonClassName,
  kdsTicketClassName,
  kdsTicketFooterClassName,
  kdsTicketGridClassName,
  kdsTicketHeaderClassName,
  kdsTimerChipClassName,
  type KdsTicketUrgency,
  text,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

function ticketUrgency(waitMinutes: number): KdsTicketUrgency {
  if (waitMinutes >= 10) return "late";
  if (waitMinutes >= 5) return "warning";
  return "on-time";
}

function getWaitTimeMinutes(createdAt: string) {
  const diff = new Date().getTime() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

type PendingAction = {
  orderId: number;
  status: "PREPARING" | "COMPLETED";
};

export default function KdsPage() {
  const { activeBranchId } = useAuth();
  const { isConnected } = useSocket();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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

  const handleUpdateStatus = async (
    orderId: number,
    status: PendingAction["status"],
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

  if (!activeBranchId) {
    return (
      <AnimatedPage className="h-full flex flex-col space-y-4">
        <header className="space-y-1 pb-3 border-b border-[var(--kds-ticket-divider)]">
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <p className={cn("text-sm", text.muted)}>Real-time order queue for this branch.</p>
        </header>
        <BranchEmptyState description="Select a branch in the top bar to view the kitchen display." />
      </AnimatedPage>
    );
  }

  const fetchError = isError ? getErrorMessage(error, "Failed to load kitchen orders") : null;

  return (
    <AnimatedPage className="h-full flex flex-col gap-4 min-h-0">
      <KdsImmersiveHeader
        isConnected={isConnected}
        queueStats={queueStats}
        isLoading={isLoading}
      />

      {fetchError && (
        <div className={kdsErrorBannerClassName()}>
          <p className={`text-sm font-medium ${text.primary}`}>{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className={kdsErrorRetryClassName()}
            onClick={() => void refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden />
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
            <Loader2
              className={`w-10 h-10 animate-spin motion-reduce:animate-none ${kdsLoadingClassName()}`}
              aria-hidden="true"
            />
            <span className="sr-only">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className={kdsEmptyStateClassName()}>
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-[var(--kds-empty-icon)]" aria-hidden />
            <p className={`font-semibold ${text.primary}`}>No pending orders</p>
            <p className={`text-sm mt-2 ${text.muted}`}>
              Kitchen is clear — new orders will appear here automatically.
            </p>
            <div className="mt-4 flex justify-center">
              <KdsConnectionBadge isConnected={isConnected} />
            </div>
          </div>
        ) : (
          <div className={kdsTicketGridClassName()}>
            {orders.map((order) => {
              const waitTime = getWaitTimeMinutes(order.createdAt);
              const urgency = ticketUrgency(waitTime);
              const isUpdating = pendingAction?.orderId === order.id;
              const isStarting =
                isUpdating && pendingAction?.status === "PREPARING";
              const isCompleting =
                isUpdating && pendingAction?.status === "COMPLETED";

              return (
                <div key={order.id} className={kdsTicketClassName(urgency)}>
                  <div className={kdsTicketHeaderClassName(urgency)}>
                    <div>
                      <div className="font-black text-3xl sm:text-4xl tracking-wider tabular-nums">
                        #{formatQueueNumber(order.queueNumber)}
                      </div>
                      <div className="text-xs opacity-80 font-mono mt-0.5">
                        Order ref {order.id}
                      </div>
                      <div className="text-sm opacity-90 font-medium mt-1">
                        {order.status === "PREPARING" ? "Preparing" : "Pending"}
                      </div>
                    </div>
                    <div className={kdsTimerChipClassName()}>
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                      {waitTime} min
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 min-h-0">
                    {order.items?.map((item: OrderItem) => (
                      <div key={item.id} className={kdsItemDividerClassName()}>
                        <div className="flex gap-3 items-start">
                          <span className={kdsItemQtyClassName()}>{item.quantity}x</span>
                          <div className="flex flex-col min-w-0 gap-1">
                            <span
                              className={`${text.primary} font-black text-xl sm:text-2xl leading-tight`}
                            >
                              {item.product?.name}
                            </span>
                            {item.modifiers?.map((modifier) => (
                              <span key={modifier.id} className={kdsItemModifierClassName()}>
                                {modifier.optionName}
                              </span>
                            ))}
                            {item.notes && (
                              <div className={kdsItemNoteClassName()}>Note: {item.notes}</div>
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
                        {isStarting ? (
                          <>
                            <Loader2
                              className="w-6 h-6 sm:w-8 sm:h-8 mr-2 animate-spin motion-reduce:animate-none"
                              aria-hidden
                            />
                            Starting…
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6 sm:w-8 sm:h-8 mr-2" aria-hidden />
                            START
                          </>
                        )}
                      </Button>
                    )}
                    {order.status === "PREPARING" && (
                      <Button
                        className={kdsDoneButtonClassName()}
                        onClick={() => void handleUpdateStatus(order.id, "COMPLETED")}
                        disabled={isUpdating}
                      >
                        {isCompleting ? (
                          <>
                            <Loader2
                              className="w-6 h-6 sm:w-8 sm:h-8 mr-2 animate-spin motion-reduce:animate-none"
                              aria-hidden
                            />
                            Completing…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mr-2" aria-hidden />
                            DONE
                          </>
                        )}
                      </Button>
                    )}
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
