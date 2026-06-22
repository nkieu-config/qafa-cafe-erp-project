"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/domains/useProductQueries";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Coffee } from "lucide-react";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { Badge } from "@/components/ui/badge";
import { Tag, Button as AntButton } from "antd";
import { DataTable } from "@/components/shared/data-table";

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };





  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            Menu Items
          </h2>
          <p className="text-sm text-slate-500">Manage products that appear on the POS terminal.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Menu Item
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
              render: (price) => <span className="font-bold text-slate-700 dark:text-slate-300">฿{price?.toFixed(2)}</span>
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
              title: "Recipe Setup",
              key: "recipe",
              render: (_, record: any) => (
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
              render: (_, record: any) => (
                <AntButton type="link" onClick={() => handleEdit(record)} icon={<Edit className="w-4 h-4" />} className="text-blue-500" />
              )
            }
          ]}
          dataSource={products || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="custom-antd-table border border-slate-200 dark:border-slate-800 rounded-lg"
        />
      </div>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
      />
    </div>
  );
}
