import type { Order, OrderStatus } from "@/types/api";

export const KDS_STATUSES: OrderStatus[] = ["PENDING", "PREPARING"];

export function mergeKdsOrders(existing: Order[], incoming: Order[]): Order[] {
  const byId = new Map<number, Order>();
  for (const order of [...existing, ...incoming]) {
    if (KDS_STATUSES.includes(order.status)) {
      byId.set(order.id, order);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function normalizeKdsOrders(data: Order[] | null | undefined): Order[] {
  return mergeKdsOrders([], data ?? []);
}
