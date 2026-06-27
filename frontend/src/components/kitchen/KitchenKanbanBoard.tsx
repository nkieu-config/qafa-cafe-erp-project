"use client";

import { ReactNode } from "react";
import { CheckCircle2, Clock, PackageOpen, PlayCircle } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ProductionOrder, Ingredient } from "@/types/api";

export type ProductionOrderWithTarget = ProductionOrder & { targetIngredient: Ingredient };

function KanbanColumn({
  id,
  title,
  icon,
  color,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  color: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[320px] max-w-[350px] flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border ${isOver ? "border-orange-400 bg-orange-50/50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-800"} overflow-hidden transition-colors`}
    >
      <div className={`p-4 border-b border-slate-200 dark:border-slate-800 font-black text-slate-700 dark:text-slate-200 flex items-center justify-between ${color}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[500px]">{children}</div>
    </div>
  );
}

function KanbanCard({ order, isOverlay = false }: { order: ProductionOrderWithTarget; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isOverlay ? "shadow-xl scale-105 rotate-2" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
          {order.orderNumber}
        </span>
        {order.status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      </div>
      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
        <PackageOpen className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="truncate">{order.targetIngredient?.name}</span>
      </div>
      <div className="text-sm font-black text-slate-600 dark:text-slate-300">
        {order.quantityToProduce}{" "}
        <span className="text-xs font-bold text-slate-400">{order.targetIngredient?.unit}</span>
      </div>
      {order.plannedStartDate && (
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium bg-slate-50 dark:bg-slate-900/50 w-fit px-2 py-1 rounded-md">
          <Clock className="w-3 h-3" />
          {new Date(order.plannedStartDate).toLocaleDateString("en-GB")}
        </div>
      )}
    </div>
  );
}

type KitchenKanbanBoardProps = {
  plannedOrders: ProductionOrderWithTarget[];
  inProgressOrders: ProductionOrderWithTarget[];
  completedOrders: ProductionOrderWithTarget[];
  activeOrder: ProductionOrderWithTarget | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export function KitchenKanbanBoard({
  plannedOrders,
  inProgressOrders,
  completedOrders,
  activeOrder,
  onDragStart,
  onDragEnd,
}: KitchenKanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        <KanbanColumn id="PLANNED" title="Planned" icon={<Clock className="w-5 h-5" />} color="text-blue-600 bg-blue-50 dark:bg-blue-900/20">
          {plannedOrders.map((o) => (
            <KanbanCard key={o.id} order={o} />
          ))}
        </KanbanColumn>

        <KanbanColumn id="IN_PROGRESS" title="In Progress" icon={<PlayCircle className="w-5 h-5" />} color="text-amber-600 bg-amber-50 dark:bg-amber-900/20">
          {inProgressOrders.map((o) => (
            <KanbanCard key={o.id} order={o} />
          ))}
        </KanbanColumn>

        <KanbanColumn id="COMPLETED" title="Completed" icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
          {completedOrders.map((o) => (
            <KanbanCard key={o.id} order={o} />
          ))}
        </KanbanColumn>
      </div>
      <DragOverlay>{activeOrder ? <KanbanCard order={activeOrder} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
