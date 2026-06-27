"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/domains/useProductQueries";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Coffee } from "lucide-react";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { Tag, Button as AntButton } from "antd";
import { DataTable } from "@/components/shared/data-table";
import { HubCard } from "@/components/shared/hub-card";
import { formatBaht } from "@/lib/money";
import { calcProductFoodCost, foodCostStatus } from "@/lib/food-cost";
import type { Product } from "@/types/api";

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <HubCard
        title="Menu Items"
        icon={Coffee}
        description="Manage products that appear on the POS terminal."
        actions={
          <Button onClick={handleAddNew} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Menu Item
          </Button>
        }
      >
        <DataTable 
          loading={isLoading}
          emptyDescription="No menu items yet. Add your first product to enable POS sales."
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              key: "id",
              render: (id) => <span className="text-slate-400">#{id}</span>
            },
            {
              title: "Menu Name",
              dataIndex: "name",
              key: "name",
              render: (name) => <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
            },
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
              render: (category) => <Tag>{category}</Tag>
            },
            {
              title: "Price (฿)",
              dataIndex: "price",
              key: "price",
              render: (price) => <span className="font-bold text-slate-700 dark:text-slate-300">{formatBaht(price)}</span>
            },
            {
              title: "Food Cost %",
              key: "foodCost",
              render: (_: unknown, record: Product) => {
                const { cost, foodCostPercent } = calcProductFoodCost(record);
                const status = foodCostStatus(foodCostPercent);
                const color =
                  status === 'good'
                    ? 'text-emerald-600'
                    : status === 'warn'
                      ? 'text-amber-600'
                      : 'text-rose-600';
                return (
                  <div>
                    <span className={`font-bold tabular-nums ${color}`}>
                      {foodCostPercent.toFixed(1)}%
                    </span>
                    <div className="text-xs text-slate-400">COGS {formatBaht(cost)}</div>
                  </div>
                );
              },
            },
            {
              title: "Status",
              key: "isActive",
              render: (_: unknown, record: Product) => (
                record.isActive !== false ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag color="default">Inactive</Tag>
                )
              )
            },
            {
              title: "Recipe Setup",
              key: "recipe",
              render: (_: unknown, record: Product) => (
                record.recipeItems && record.recipeItems.length > 0 ? (
                  <Tag color="processing">{record.recipeItems.length} ingredients</Tag>
                ) : (
                  <Tag color="default">No Recipe</Tag>
                )
              )
            },
            {
              title: "Actions",
              key: "actions",
              align: "right",
              render: (_: unknown, record: Product) => (
                <AntButton type="link" onClick={() => handleEdit(record)} icon={<Edit className="w-4 h-4" />} className="text-blue-500" />
              )
            }
          ]}
          dataSource={products || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          hideBorders
        />
      </HubCard>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct ?? undefined} 
      />
    </>
  );
}
