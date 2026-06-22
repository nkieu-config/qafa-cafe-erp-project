"use client";

import { useState } from "react";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { IngredientFormModal } from "@/components/products/IngredientFormModal";
import { Badge } from "@/components/ui/badge";
import { Tag, Button as AntButton } from "antd";
import { DataTable } from "@/components/shared/data-table";

export default function IngredientsPage() {
  const { data: ingredients, isLoading } = useIngredients();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  const handleEdit = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedIngredient(null);
    setIsModalOpen(true);
  };





  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Raw Ingredients Catalog</h2>
          <p className="text-sm text-slate-500">Manage all raw materials used in your recipes.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Add Ingredient
        </Button>
      </div>

      <div className="mt-6">
        <DataTable 
          loading={isLoading}
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
              render: (costPerUnit) => <span className="text-slate-500 tabular-nums">฿{costPerUnit?.toFixed(2)}</span>
            },
            {
              title: "Status",
              key: "isActive",
              render: (_, record: any) => (
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
              render: (_, record: any) => (
                <AntButton type="link" onClick={() => handleEdit(record)} icon={<Edit className="w-4 h-4" />} className="text-blue-500" />
              )
            }
          ]}
          dataSource={ingredients || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="custom-antd-table border border-slate-200 dark:border-slate-800 rounded-lg"
        />
      </div>

      <IngredientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        ingredient={selectedIngredient} 
      />
    </div>
  );
}
