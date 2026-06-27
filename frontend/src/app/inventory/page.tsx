"use client";

import { useBranchInventory } from "@/hooks/domains/useInventoryQueries";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";

import type { BranchInventory } from "@/types/api";

type InventoryRow = BranchInventory & { ingredient?: { name: string; unit: string } };

export default function InventoryBalancePage() {
  const { activeBranchId } = useAuth();
  const { data: inventoryData, isLoading } = useBranchInventory(activeBranchId || undefined);
  const inventory = inventoryData || [];

  if (!activeBranchId) {
    return <BranchEmptyState description="Select a branch in the top bar to view stock balances." />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Branch Stock Balance
          </h2>
          <p className="text-sm text-slate-500">Current aggregate stock for all raw ingredients.</p>
        </div>
      </div>

      <div className="mt-4">
        <DataTable 
          loading={isLoading}
          columns={[
            {
              title: "Ingredient Name",
              key: "name",
              render: (_: unknown, record: InventoryRow) => <span className="font-medium text-slate-800 dark:text-slate-200">{record.ingredient?.name}</span>
            },
            {
              title: "Stock Balance",
              key: "stock",
              render: (_: unknown, record: InventoryRow) => {
                const isLowStock = record.stock <= record.minStock;
                const isOut = record.stock <= 0;
                return (
                  <span className={`font-bold tabular-nums ${isOut ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {record.stock.toFixed(2)}
                  </span>
                )
              }
            },
            {
              title: "Unit",
              key: "unit",
              render: (_: unknown, record: InventoryRow) => <span className="text-slate-500">{record.ingredient?.unit}</span>
            },
            {
              title: "Status",
              key: "status",
              render: (_: unknown, record: InventoryRow) => {
                const isLowStock = record.stock <= record.minStock;
                const isOut = record.stock <= 0;
                if (isOut) {
                  return (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTriangle className="w-3 h-3" /> Out of Stock
                    </Badge>
                  );
                }
                if (isLowStock) {
                  return (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </Badge>
                  );
                }
                return (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                    Healthy
                  </Badge>
                );
              }
            }
          ]}
          dataSource={inventory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}
