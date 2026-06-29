import { CheckCircle2, Clock, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatKdsWaitLabel,
  getWaitTimeMinutes,
  ticketUrgency,
} from "@/lib/kds-display";
import { formatQueueNumber } from "@/lib/queue";
import {
  kdsConfirmCancelButtonClassName,
  kdsDoneButtonClassName,
  kdsItemDividerClassName,
  kdsItemModifierClassName,
  kdsItemModifiersWrapClassName,
  kdsItemNoteClassName,
  kdsItemQtyClassName,
  kdsStartButtonClassName,
  kdsTicketClassName,
  kdsTicketFooterClassName,
  kdsTicketHeaderClassName,
  kdsTicketStatusBadgeClassName,
  kdsTimerChipClassName,
} from "@/lib/theme/immersive";
import { text } from "@/lib/theme/surface";
import { cn } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types/api";

export type KdsPendingAction = {
  orderId: number;
  status: Extract<OrderStatus, "PREPARING" | "COMPLETED">;
};

type KdsOrderTicketProps = {
  order: Order;
  now: number;
  pendingAction: KdsPendingAction | null;
  confirmDoneId: number | null;
  onStart: (orderId: number) => void;
  onRequestDone: (orderId: number) => void;
  onCancelDone: () => void;
  onConfirmDone: (order: Order) => void;
};

function KdsTicketItem({ item }: { item: OrderItem }) {
  const hasModifiers = (item.modifiers?.length ?? 0) > 0;

  return (
    <div className={kdsItemDividerClassName()}>
      <div className="flex items-start gap-3">
        <span className={kdsItemQtyClassName()} aria-hidden>
          {item.quantity}x
        </span>
        <div className="min-w-0 flex flex-col gap-1">
          <span
            className={cn(
              text.primary,
              "font-black text-xl sm:text-2xl leading-tight break-words",
            )}
          >
            {item.product?.name ?? "Item"}
          </span>
          {hasModifiers && (
            <div className={kdsItemModifiersWrapClassName()} role="list" aria-label="Modifiers">
              {item.modifiers!.map((modifier) => (
                <span key={modifier.id} className={kdsItemModifierClassName()} role="listitem">
                  {modifier.optionName}
                </span>
              ))}
            </div>
          )}
          {item.notes?.trim() && (
            <p className={kdsItemNoteClassName()}>
              <span className="font-bold uppercase text-xs tracking-wide mr-1.5">Note</span>
              <span className="font-medium">{item.notes.trim()}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function KdsOrderTicket({
  order,
  now,
  pendingAction,
  confirmDoneId,
  onStart,
  onRequestDone,
  onCancelDone,
  onConfirmDone,
}: KdsOrderTicketProps) {
  const queueLabel = formatQueueNumber(order.queueNumber);
  const waitMinutes = getWaitTimeMinutes(order.createdAt, now);
  const waitLabel = formatKdsWaitLabel(waitMinutes);
  const urgency = ticketUrgency(waitMinutes);
  const isUpdating = pendingAction?.orderId === order.id;
  const isStarting = isUpdating && pendingAction?.status === "PREPARING";
  const isCompleting = isUpdating && pendingAction?.status === "COMPLETED";
  const isConfirmingDone = confirmDoneId === order.id;
  const titleId = `kds-ticket-${order.id}-title`;

  return (
    <article className={kdsTicketClassName(urgency)} aria-labelledby={titleId}>
      <div className={kdsTicketHeaderClassName(urgency)}>
        <div className="min-w-0">
          <div
            id={titleId}
            className="font-black text-3xl sm:text-4xl tracking-wider tabular-nums"
          >
            #{queueLabel}
          </div>
          <span
            className={kdsTicketStatusBadgeClassName(
              order.status === "PREPARING" ? "PREPARING" : "PENDING",
            )}
          >
            {order.status === "PREPARING" ? "Cooking" : "New"}
          </span>
        </div>
        <div className={kdsTimerChipClassName()} aria-label={`Waiting ${waitLabel}`}>
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" aria-hidden />
          <span className="tabular-nums">{waitLabel}</span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {order.items?.map((item) => (
          <KdsTicketItem key={item.id} item={item} />
        ))}
      </div>

      <div className={kdsTicketFooterClassName()}>
        {order.status === "PENDING" && (
          <Button
            className={kdsStartButtonClassName()}
            onClick={() => onStart(order.id)}
            disabled={isUpdating}
            aria-label={`Start order ${queueLabel}`}
          >
            {isStarting ? (
              <>
                <Loader2
                  className="mr-2 h-6 w-6 animate-spin motion-reduce:animate-none sm:h-8 sm:w-8"
                  aria-hidden
                />
                Starting…
              </>
            ) : (
              <>
                <Play className="mr-2 h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
                Start
              </>
            )}
          </Button>
        )}
        {order.status === "PREPARING" && isConfirmingDone ? (
          <>
            <Button
              type="button"
              variant="outline"
              className={kdsConfirmCancelButtonClassName()}
              onClick={onCancelDone}
              disabled={isUpdating}
              aria-label={`Cancel completing order ${queueLabel}`}
            >
              Cancel
            </Button>
            <Button
              className={kdsDoneButtonClassName()}
              onClick={() => onConfirmDone(order)}
              disabled={isUpdating}
              aria-label={`Confirm order ${queueLabel} is done`}
            >
              {isCompleting ? (
                <>
                  <Loader2
                    className="mr-2 h-6 w-6 animate-spin motion-reduce:animate-none sm:h-8 sm:w-8"
                    aria-hidden
                  />
                  Completing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
                  Confirm Done
                </>
              )}
            </Button>
          </>
        ) : null}
        {order.status === "PREPARING" && !isConfirmingDone && (
          <Button
            className={kdsDoneButtonClassName()}
            onClick={() => onRequestDone(order.id)}
            disabled={isUpdating}
            aria-label={`Mark order ${queueLabel} as done`}
          >
            <CheckCircle2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
            Done
          </Button>
        )}
      </div>
    </article>
  );
}
