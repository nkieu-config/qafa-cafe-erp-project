import { KdsOrderColumn } from "@/components/kds/KdsOrderColumn";
import type { KdsPendingAction } from "@/components/kds/KdsOrderTicket";
import { splitKdsOrdersByStatus } from "@/lib/kds-display";
import { kdsColumnBoardClassName } from "@/lib/theme/immersive";
import type { Order } from "@/types/api";

type KdsOrderBoardProps = {
  orders: Order[];
  now: number;
  pendingAction: KdsPendingAction | null;
  confirmDoneId: number | null;
  onStart: (orderId: number) => void;
  onRequestDone: (orderId: number) => void;
  onCancelDone: () => void;
  onConfirmDone: (order: Order) => void;
};

export function KdsOrderBoard({
  orders,
  now,
  pendingAction,
  confirmDoneId,
  onStart,
  onRequestDone,
  onCancelDone,
  onConfirmDone,
}: KdsOrderBoardProps) {
  const { pending, preparing } = splitKdsOrdersByStatus(orders);

  return (
    <div className={kdsColumnBoardClassName()}>
      <KdsOrderColumn
        title="New orders"
        description="Accept and start preparing incoming tickets."
        orders={pending}
        now={now}
        pendingAction={pendingAction}
        confirmDoneId={confirmDoneId}
        emptyMessage="No new orders — waiting for the next ticket."
        onStart={onStart}
        onRequestDone={onRequestDone}
        onCancelDone={onCancelDone}
        onConfirmDone={onConfirmDone}
      />
      <KdsOrderColumn
        title="Cooking"
        description="Finish and hand off completed orders."
        orders={preparing}
        now={now}
        pendingAction={pendingAction}
        confirmDoneId={confirmDoneId}
        emptyMessage="Nothing on the pass — start a new order from the left."
        onStart={onStart}
        onRequestDone={onRequestDone}
        onCancelDone={onCancelDone}
        onConfirmDone={onConfirmDone}
      />
    </div>
  );
}
