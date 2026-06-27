"use client";

import { useState } from "react";
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

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live Sync
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-mono text-sm font-bold bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 rounded-full">
      <WifiOff className="w-3.5 h-3.5" />
      Socket disconnected — polling every 30s
    </div>
  );
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

  const getWaitTimeMinutes = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  if (!activeBranchId) {
    return (
      <AnimatedPage className="h-full flex flex-col space-y-4">
        <HubPageHeader
          title="Kitchen Display System (KDS)"
          icon={MonitorPlay}
          description="Real-time order queue"
        />
        <BranchEmptyState description="Select a branch in the top bar to view the kitchen display." />
      </AnimatedPage>
    );
  }

  const fetchError = isError ? getErrorMessage(error, "Failed to load kitchen orders") : null;

  return (
    <AnimatedPage className="h-full flex flex-col space-y-4">
      <HubPageHeader
        title="Kitchen Display System (KDS)"
        icon={MonitorPlay}
        description="Real-time order queue"
        actions={<ConnectionBadge isConnected={isConnected} />}
      />

      {fetchError && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{fetchError}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 shrink-0"
            onClick={() => void refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-x-auto pb-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="w-full py-20 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ChefHat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="font-semibold text-slate-800 dark:text-slate-100">No pending orders</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Kitchen is clear — new orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="flex gap-4 h-full items-start">
            {orders.map((order) => {
              const waitTime = getWaitTimeMinutes(order.createdAt);
              const isLate = waitTime >= 10;
              const isWarning = waitTime >= 5 && waitTime < 10;
              const isUpdating = updatingOrderId === order.id;

              const headerColorClass = isLate ? "bg-rose-600" : isWarning ? "bg-amber-500" : "bg-emerald-500";
              const borderClass = isLate
                ? "border-rose-600 animate-[pulse_2s_ease-in-out_infinite]"
                : isWarning
                  ? "border-amber-500"
                  : "border-emerald-500";

              return (
                <div
                  key={order.id}
                  className={`flex-shrink-0 w-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-4 overflow-hidden flex flex-col transition-all ${borderClass}`}
                >
                  <div className={`p-5 flex justify-between items-center text-white ${headerColorClass}`}>
                    <div>
                      <div className="font-black text-4xl tracking-wider tabular-nums">#{formatQueueNumber(order.queueNumber)}</div>
                      <div className="text-xs opacity-80 font-mono mt-0.5">Order ref {order.id}</div>
                      <div className="text-sm opacity-90 font-medium flex items-center gap-2 mt-1">
                        {order.status === "PREPARING" ? "กำลังทำ (Preparing)" : "รอคิว (Pending)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xl font-bold bg-black/20 px-3 py-2 rounded-lg shadow-inner">
                      <Clock className="w-6 h-6" />
                      {waitTime} min
                    </div>
                  </div>

                  <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    {order.items?.map((item: OrderItem) => (
                      <div key={item.id} className="border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="flex gap-3 items-start">
                          <span className="text-emerald-600 dark:text-emerald-400 font-black text-2xl">{item.quantity}x</span>
                          <div className="flex flex-col">
                            <span className="text-slate-800 dark:text-slate-100 font-black text-2xl leading-tight">{item.product?.name}</span>
                            {item.notes && (
                              <div className="mt-2 text-xl font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded inline-block">
                                + {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    {order.status === "PENDING" && (
                      <Button
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-2xl h-24 shadow-lg active:scale-95 transition-transform"
                        onClick={() => void handleUpdateStatus(order.id, "PREPARING")}
                        disabled={isUpdating}
                      >
                        <Play className="w-8 h-8 mr-2" /> START
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl h-24 shadow-lg active:scale-95 transition-transform"
                      onClick={() => void handleUpdateStatus(order.id, "COMPLETED")}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="w-8 h-8 mr-2" /> DONE
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
