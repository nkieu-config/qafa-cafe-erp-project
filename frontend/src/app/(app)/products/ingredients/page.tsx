"use client";

import { useState } from "react";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { Button } from "@/components/ui/button";
import { Plus, Edit, FlaskConical } from "lucide-react";
import { IngredientFormModal } from "@/components/products/IngredientFormModal";
import { Tag, Button as AntButton } from "antd";
import { DataTable } from "@/components/shared/data-table";
import { HubCard } from "@/components/shared/hub-card";
import type { Ingredient } from "@/types/api";
import { formatBaht } from "@/lib/money";

export default function IngredientsPage() {
  const { data: ingredients, isLoading } = useIngredients();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedIngredient(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <HubCard
        title="Raw Ingredients Catalog"
        icon={FlaskConical}
        description="Manage all raw materials used in your recipes."
        actions={
          <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Add Ingredient
          </Button>
        }
      >
        <DataTable 
          loading={isLoading}
          emptyDescription="No ingredients yet. Add raw materials to build recipes and BOMs."
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              key: "id",
              render: (id) => <span className="text-slate-400">#{id}</span>
            },
            {
              title: "Ingredient Name",
              dataIndex: "name",
              key: "name",
              render: (name) => <span className="font-medium text-slate-800 dark:text-slate-200">{name}</span>
            },
            {
              title: "Unit",
              dataIndex: "unit",
              key: "unit",
              render: (unit) => <span className="text-slate-500">{unit}</span>
            },
            {
              title: "Cost / Unit (฿)",
              dataIndex: "costPerUnit",
              key: "costPerUnit",
              render: (costPerUnit) => (
                <span className="text-slate-500 tabular-nums">{formatBaht(costPerUnit)}</span>
              ),
            },
            {
              title: "Status",
              key: "isActive",
              render: (_: unknown, record: Ingredient) => (
                record.isActive !== false ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag color="default">Inactive</Tag>
                )
              )
            },
            {
              title: "Actions",
              key: "actions",
              align: "right",
              render: (_: unknown, record: Ingredient) => (
                <AntButton type="link" onClick={() => handleEdit(record)} icon={<Edit className="w-4 h-4" />} className="text-blue-500" />
              )
            }
          ]}
          dataSource={ingredients || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          hideBorders
        />
      </HubCard>

      <IngredientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        ingredient={selectedIngredient ?? undefined} 
      />
    </>
  );
}
