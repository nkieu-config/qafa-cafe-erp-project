"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import type { Order, OrderStatus } from "@/types/api";
import { KDS_STATUSES, mergeKdsOrders } from "@/lib/kds-utils";
import { formatQueueNumber } from "@/lib/queue";
import { kdsOrdersQueryKey } from "@/hooks/domains/usePosQueries";

export function useKdsSocketSync(branchId?: number) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !branchId) return;

    const handleOrderCreated = (newOrder: Order) => {
      if (newOrder.branchId !== branchId || !KDS_STATUSES.includes(newOrder.status)) return;
      queryClient.setQueryData<Order[]>(kdsOrdersQueryKey(branchId), (old) =>
        mergeKdsOrders(old ?? [], [newOrder]),
      );
      const queueLabel =
        newOrder.queueNumber != null && newOrder.queueNumber > 0
          ? `#${formatQueueNumber(newOrder.queueNumber)}`
          : `#${newOrder.id}`;
      toast.message(`New kitchen order ${queueLabel}`);
    };

    const handleOrderStatusUpdated = (data: { orderId: number; status: OrderStatus }) => {
      queryClient.setQueryData<Order[]>(kdsOrdersQueryKey(branchId), (old) => {
        const current = old ?? [];
        if (data.status === "COMPLETED" || !KDS_STATUSES.includes(data.status)) {
          return current.filter((o) => o.id !== data.orderId);
        }
        return mergeKdsOrders(
          current.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o)),
          [],
        );
      });
    };

    socket.on("orderCreated", handleOrderCreated);
    socket.on("orderStatusUpdated", handleOrderStatusUpdated);

    return () => {
      socket.off("orderCreated", handleOrderCreated);
      socket.off("orderStatusUpdated", handleOrderStatusUpdated);
    };
  }, [socket, branchId, queryClient]);
}
