import { KdsOrderTicket, type KdsPendingAction } from "@/components/kds/KdsOrderTicket";
import {
  kdsColumnClassName,
  kdsColumnEmptyClassName,
  kdsColumnHeaderClassName,
  kdsColumnScrollClassName,
  kdsColumnTicketStackClassName,
} from "@/lib/theme/immersive";
import { text } from "@/lib/theme/surface";
import { typeUiLabelClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";

type KdsOrderColumnProps = {
  title: string;
  description: string;
  orders: Order[];
  now: number;
  pendingAction: KdsPendingAction | null;
  confirmDoneId: number | null;
  emptyMessage: string;
  onStart: (orderId: number) => void;
  onRequestDone: (orderId: number) => void;
  onCancelDone: () => void;
  onConfirmDone: (order: Order) => void;
};

export function KdsOrderColumn({
  title,
  description,
  orders,
  now,
  pendingAction,
  confirmDoneId,
  emptyMessage,
  onStart,
  onRequestDone,
  onCancelDone,
  onConfirmDone,
}: KdsOrderColumnProps) {
  return (
    <section className={kdsColumnClassName()} aria-label={title}>
      <header className={kdsColumnHeaderClassName()}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={typeUiLabelClassName(text.primary)}>{title}</h2>
          <span className={cn("text-sm tabular-nums", text.muted)}>{orders.length}</span>
        </div>
        <p className={cn("mt-0.5 text-xs sm:text-sm", text.muted)}>{description}</p>
      </header>

      <div className={kdsColumnScrollClassName()}>
        {orders.length === 0 ? (
          <p className={kdsColumnEmptyClassName()}>{emptyMessage}</p>
        ) : (
          <div className={kdsColumnTicketStackClassName()}>
            {orders.map((order) => (
              <KdsOrderTicket
                key={order.id}
                order={order}
                now={now}
                pendingAction={pendingAction}
                confirmDoneId={confirmDoneId}
                onStart={onStart}
                onRequestDone={onRequestDone}
                onCancelDone={onCancelDone}
                onConfirmDone={onConfirmDone}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
