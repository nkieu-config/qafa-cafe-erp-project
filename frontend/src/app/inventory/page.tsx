"use client";

import { useEffect, useState } from "react";
import { getIngredients } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackageOpen } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = () => {
    setLoading(true);
    getIngredients()
      .then(setIngredients)
      .catch((err) => toast.error("Failed to load inventory: " + err.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="p-10 text-center">Loading Inventory...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-2">
            <PackageOpen className="text-amber-600" /> Inventory Management
          </h1>
          <p className="text-slate-500">Track and manage your raw materials in real-time.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Ingredient Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Stock Level</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((item) => {
              const isLowStock = item.stock <= item.minStock;
              return (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-semibold text-slate-700">{item.name}</TableCell>
                  <TableCell>
                    <span className="font-medium">{item.stock}</span> <span className="text-slate-400">{item.unit}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.minStock}</span> <span className="text-slate-400">{item.unit}</span>
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <Badge variant="destructive" className="bg-rose-500">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">In Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {ingredients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  No ingredients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
