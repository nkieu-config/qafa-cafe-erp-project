"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  useKitchenOrders,
  useIngredients,
  useCompleteKitchenOrder,
  useUpdateOrderStatus,
  useCreateProductionOrder,
} from "@/hooks/domains/useProductionQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { Button, Form, Select, InputNumber, DatePicker, Spin } from "antd";
import { Ingredient } from "@/types/api";
import { FormModal } from "@/components/shared/form-modal";
import { ChefHat, Plus } from "lucide-react";
import { toast } from "sonner";
import { HubPageHeader } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { useAuth } from "@/context/AuthContext";
import type { Branch } from "@/types/api";
import type { ProductionOrderWithTarget } from "@/components/kitchen/KitchenKanbanBoard";

const KitchenKanbanBoard = dynamic(
  () => import("@/components/kitchen/KitchenKanbanBoard").then((m) => m.KitchenKanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 flex justify-center">
        <Spin size="large" />
      </div>
    ),
  },
);

export default function CentralKitchenPage() {
  const { activeBranchId, setActiveBranchId } = useAuth();
  const { data: branchesData = [] } = useBranches();
  const branches = branchesData as Branch[];
  const { data: ingredients = [] } = useIngredients();
  const { data: ordersData = [], isLoading } = useKitchenOrders();

  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const centralKitchen = branches.find((b) => b.isCentralKitchen);
  const isCentralKitchen = activeBranch?.isCentralKitchen === true;

  const orders = ordersData
    .filter((o: ProductionOrderWithTarget) => ["PLANNED", "IN_PROGRESS", "COMPLETED"].includes(o.status))
    .filter((o: ProductionOrderWithTarget) => !activeBranchId || o.branchId === activeBranchId);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeOrder, setActiveOrder] = useState<ProductionOrderWithTarget | null>(null);

  const completeMutation = useCompleteKitchenOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const createOrderMutation = useCreateProductionOrder();

  const handleCreate = async (values: { targetIngredientId: number; quantityToProduce: number; plannedStartDate?: Date }) => {
    if (!activeBranchId) return toast.error("Please select a branch");
    if (!isCentralKitchen) return toast.error("Switch to a central kitchen branch to create production orders");
    try {
      await createOrderMutation.mutateAsync({
        branchId: activeBranchId,
        targetIngredientId: values.targetIngredientId,
        quantityToProduce: values.quantityToProduce,
        plannedStartDate: values.plannedStartDate ? values.plannedStartDate.toISOString() : undefined,
      });
      toast.success("Production order created");
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to create order");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find((o: ProductionOrderWithTarget) => o.id === active.id);
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
          loading: "Deducting raw materials...",
          success: "Production completed & inventory updated!",
          error: (err: unknown) => (err instanceof Error ? err.message : "Failed to complete order"),
        });
      } else {
        await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      }
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to update status");
    }
  };

  const plannedOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "PLANNED");
  const inProgressOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "IN_PROGRESS");
  const completedOrders = orders.filter((o: ProductionOrderWithTarget) => o.status === "COMPLETED");

  const branchGuard = !activeBranchId ? (
    <BranchEmptyState description="Use the branch selector in the top bar to manage production." />
  ) : !isCentralKitchen ? (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-10 text-center max-w-lg mx-auto">
      <ChefHat className="w-10 h-10 text-orange-500 mx-auto mb-4" />
      <p className="font-semibold text-slate-800 dark:text-slate-100">{activeBranch?.name} is not a central kitchen</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
        Production orders are managed at a central kitchen branch. Switch branches to continue.
      </p>
      {centralKitchen && (
        <Button
          type="primary"
          className="mt-6 bg-orange-500 hover:bg-orange-600 border-none font-bold"
          onClick={() => setActiveBranchId(centralKitchen.id)}
        >
          Switch to {centralKitchen.name}
        </Button>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-6 w-full">
      <HubPageHeader
        title="Production Board"
        icon={ChefHat}
        description="Drag and drop orders to update status."
        actions={
          isCentralKitchen ? (
            <Button
              type="primary"
              className="bg-orange-500 hover:bg-orange-600 shadow-sm font-bold flex items-center border-none"
              onClick={() => setIsModalVisible(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              New Order
            </Button>
          ) : undefined
        }
      />

      {branchGuard ? (
        branchGuard
      ) : isLoading && orders.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <KitchenKanbanBoard
          plannedOrders={plannedOrders}
          inProgressOrders={inProgressOrders}
          completedOrders={completedOrders}
          activeOrder={activeOrder}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      <FormModal title="Create Production Order" isOpen={isModalVisible} onClose={() => setIsModalVisible(false)} width={500}>
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item
            name="targetIngredientId"
            label={<span className="font-bold">Target Product</span>}
            rules={[{ required: true, message: "Please select a target product" }]}
          >
            <Select
              showSearch
              placeholder="Select Target Product"
              optionFilterProp="children"
              options={ingredients.map((i: Ingredient) => ({ label: i.name, value: i.id }))}
              className="h-11"
            />
          </Form.Item>

          <Form.Item
            name="quantityToProduce"
            label={<span className="font-bold">Quantity</span>}
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber className="w-full h-11 flex items-center" min={1} />
          </Form.Item>

          <Form.Item
            name="plannedStartDate"
            label={<span className="font-bold">Planned Date</span>}
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker className="w-full h-11" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)} className="font-bold">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="bg-orange-500 hover:bg-orange-600 border-none font-bold px-6">
              Create Order
            </Button>
          </div>
        </Form>
      </FormModal>
    </div>
  );
}
