"use client";

import { useState } from "react";
import { useStockIn } from "@/hooks/domains/useInventoryQueries";
import { useIngredients } from "@/hooks/domains/useProductQueries";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowDownToLine, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { filterActive, updateLineItem } from "@/lib/form";
import type { Ingredient, StockLineItem } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubCard } from "@/components/shared/hub-card";

export default function StockInPage() {
  const { activeBranchId } = useAuth();
  const router = useRouter();
  
  const { data: ingredientsData } = useIngredients();
  const ingredients = filterActive((ingredientsData || []) as Ingredient[]);
  
  const stockInMutation = useStockIn();

  const [items, setItems] = useState<StockLineItem[]>([
    { ingredientId: 0, quantity: 0, expiryDate: "" }
  ]);

  const handleAddItem = () => {
    setItems([...items, { ingredientId: 0, quantity: 0, expiryDate: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChange = <K extends keyof StockLineItem>(index: number, field: K, value: StockLineItem[K]) => {
    setItems(updateLineItem(items, index, field, value));
  };

  const handleSubmit = async () => {
    if (!activeBranchId) {
      toast.error("No active branch selected.");
      return;
    }

    const validItems = items.filter(i => i.ingredientId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid ingredient with quantity > 0.");
      return;
    }

    try {
      await stockInMutation.mutateAsync({
        branchId: activeBranchId,
        items: validItems.map(i => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : undefined
        }))
      });
      toast.success("Stock received successfully!");
      router.push("/inventory");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to receive stock"));
    }
  };

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to receive stock." />
    );
  }

  return (
    <HubCard
      title="Good Receipt Note (GRN)"
      icon={ArrowDownToLine}
      description="Record new raw ingredients received from suppliers or central kitchen."
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="flex-1 space-y-2">
              <Label>Ingredient</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={item.ingredientId}
                onChange={(e) => handleChange(idx, 'ingredientId', Number(e.target.value))}
              >
                <option value={0}>Select ingredient...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>
            
            <div className="w-32 space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min="0.01" 
                step="0.01"
                placeholder="Qty"
                value={item.quantity || ""} 
                onChange={(e) => handleChange(idx, 'quantity', Number(e.target.value))} 
              />
            </div>

            <div className="w-48 space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input 
                type="date" 
                value={item.expiryDate} 
                onChange={(e) => handleChange(idx, 'expiryDate', e.target.value)} 
              />
            </div>

            <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={handleAddItem} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Another Row
        </Button>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/inventory")}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={stockInMutation.isPending}>
          {stockInMutation.isPending ? "Saving..." : "Confirm & Receive Stock"}
        </Button>
      </div>
    </HubCard>
  );
}
