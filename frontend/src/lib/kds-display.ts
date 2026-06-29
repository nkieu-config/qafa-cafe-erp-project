import type { KdsTicketUrgency } from "@/lib/theme/immersive";

export function getWaitTimeMinutes(createdAt: string, now = Date.now()): number {
  const diff = now - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / 60_000));
}

export function formatKdsWaitLabel(waitMinutes: number): string {
  if (waitMinutes < 1) return "<1 min";
  return `${waitMinutes} min`;
}

export function ticketUrgency(waitMinutes: number): KdsTicketUrgency {
  if (waitMinutes >= 10) return "late";
  if (waitMinutes >= 5) return "warning";
  return "on-time";
}

export function splitKdsOrdersByStatus<T extends { status: string }>(orders: T[]) {
  const pending: T[] = [];
  const preparing: T[] = [];
  for (const order of orders) {
    if (order.status === "PREPARING") {
      preparing.push(order);
    } else {
      pending.push(order);
    }
  }
  return { pending, preparing };
}
