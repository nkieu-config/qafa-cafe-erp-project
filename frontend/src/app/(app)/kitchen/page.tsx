"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  useKitchenOrders,
  useCompleteKitchenOrder,
  useUpdateOrderStatus,
  useCreateProductionOrder,
} from "@/hooks/domains/useProductionQueries";
import { useProductionBOMs } from "@/hooks/domains/useAccountingQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { ChefHat, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { HubListPage } from "@/components/shared/hub-list-page";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { CreateProductionOrderModal } from "@/components/kitchen/CreateProductionOrderModal";
import { CentralKitchenBranchNotice } from "@/components/kitchen/central-kitchen-banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import type { Branch, ProductionBOM } from "@/types/api";
import type { ProductionOrderWithTarget } from "@/components/kitchen/KitchenKanbanBoard";
import { getErrorMessage } from "@/lib/errors";
import { getBomTargetIds } from "@/lib/bom-filters";
import { summarizeProductionOrders } from "@/lib/production-order-filters";
import {
  hubCtaClassName,
  hubLoadingSpinnerClassName,
  kitchenSectionPanelClassName,
} from "@/lib/theme";

const KitchenKanbanBoard = dynamic(
  () => import("@/components/kitchen/KitchenKanbanBoard").then((m) => m.KitchenKanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 flex justify-center">
        <Loader2 className={hubLoadingSpinnerClassName()} aria-hidden />
        <span className="sr-only">Loading production board…</span>
      </div>
    ),
  },
);

export default function CentralKitchenPage() {
  const { activeBranchId } = useAuth();
  const { data: branchesData = [] } = useBranches();
  const branches = branchesData as Branch[];
  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const isCentralKitchen = activeBranch?.isCentralKitchen === true;

  const { data: ingredients = [] } = useIngredients();
  const {
    data: ordersData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useKitchenOrders();
  const { data: bomsData = [] } = useProductionBOMs();

  const orders = ordersData
    .filter((o: ProductionOrderWithTarget) =>
      ["PLANNED", "IN_PROGRESS", "COMPLETED"].includes(o.status),
    )
    .filter((o: ProductionOrderWithTarget) => !activeBranchId || o.branchId === activeBranchId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ProductionOrderWithTarget | null>(null);

  const completeMutation = useCompleteKitchenOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const createOrderMutation = useCreateProductionOrder();

  const bomTargetIds = useMemo(
    () => getBomTargetIds(bomsData as ProductionBOM[]),
    [bomsData],
  );

  const summary = useMemo(() => summarizeProductionOrders(orders), [orders]);

  const handleCreate = async (payload: {
    targetIngredientId: number;
    quantityToProduce: number;
    plannedStartDate: string;
  }) => {
    if (!activeBranchId) {
      toast.error("Please select a branch");
      return;
    }
    try {
      await createOrderMutation.mutateAsync({
        branchId: activeBranchId,
        ...payload,
      });
      toast.success("Production order created");
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to create order"));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const order = orders.find((o: ProductionOrderWithTarget) => o.id === event.active.id);
    setActiveOrder(order ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as number;
    const newStatus = over.id as string;
    const order = orders.find((o: ProductionOrderWithTarget) => o.id === orderId);

    if (!order || order.status === newStatus) return;

    if (order.status === "COMPLETED") {
      toast.error("Cannot change status of a completed order.");
      return;
    }

    try {
      if (newStatus === "COMPLETED") {
        toast.promise(completeMutation.mutateAsync(orderId), {
          loading: "Deducting raw materials…",
          success: "Production completed & inventory updated!",
          error: (err: unknown) => getErrorMessage(err, "Failed to complete order"),
        });
      } else {
        await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const plannedOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "PLANNED");
  const inProgressOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "IN_PROGRESS");
  const completedOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "COMPLETED");

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Use the branch selector in the top bar to manage production." />
    );
  }

  return (
    <div className="space-y-6 w-full">
      <HubPageHeader
        hideTitle
        icon={ChefHat}
        accentHub="kitchen"
        actions={
          isCentralKitchen ? (
            <Button
              className={hubCtaClassName("kitchen", "font-bold")}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              New order
            </Button>
          ) : undefined
        }
      />

      {!isCentralKitchen ? (
        <CentralKitchenBranchNotice mode="blocking" />
      ) : (
        <HubListPage className={kitchenSectionPanelClassName()}>
        <HubListPage.Error
          message={isError ? getErrorMessage(error, "Failed to load production orders") : undefined}
          onRetry={() => void refetch()}
          loading={isFetching}
        />

        <HubListPage.Count
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
        >
          {summary.total === 0
            ? "No production orders yet"
            : `${summary.total} production order${summary.total === 1 ? "" : "s"} · ${summary.planned} planned · ${summary.inProgress} in progress · ${summary.completed} completed`}
          {isFetching && !isLoading && " · Updating…"}
        </HubListPage.Count>

        <HubListPage.Body>
        {isLoading && orders.length === 0 ? (
          <div className="py-20 flex justify-center">
            <Loader2 className={hubLoadingSpinnerClassName()} aria-hidden />
            <span className="sr-only">Loading production board…</span>
          </div>
        ) : !isError ? (
          <KitchenKanbanBoard
            plannedOrders={plannedOrders}
            inProgressOrders={inProgressOrders}
            completedOrders={completedOrders}
            activeOrder={activeOrder}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ) : null}
        </HubListPage.Body>
        </HubListPage>
      )}

      {isCentralKitchen && (
        <CreateProductionOrderModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ingredients={ingredients}
          bomTargetIds={bomTargetIds}
          onSubmit={handleCreate}
          isSubmitting={createOrderMutation.isPending}
        />
      )}
    </div>
  );
}
