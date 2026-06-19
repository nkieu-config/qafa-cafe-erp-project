"use client";

import { useEffect, useState } from "react";
import { getBranch, getTransfers, acceptTransfer, createTransfer, getBranches, addInventoryBatch, reportWaste } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackageOpen, ArrowRightLeft, CheckCircle2, PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AnimatedPage } from "@/components/animated-page";

export default function InventoryPage() {
  const { activeBranchId } = useAuth();
  const [inventories, setInventories] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [transferTarget, setTransferTarget] = useState("");
  const [transferIngredient, setTransferIngredient] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Batch Form State
  const [batchIngredient, setBatchIngredient] = useState("");
  const [batchQty, setBatchQty] = useState("");
  const [batchExpiry, setBatchExpiry] = useState("");
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  useEffect(() => {
    if (activeBranchId) {
      fetchInventory();
      getBranches().then(setBranches);
    } else {
      setInventories([]);
      setLoading(false);
    }
  }, [activeBranchId]);

  const fetchInventory = () => {
    setLoading(true);
    Promise.all([getBranch(activeBranchId!), getTransfers(activeBranchId!)])
      .then(([branch, transfersData]) => {
        setInventories(branch.inventories || []);
        setBatches(branch.inventoryBatches || []);
        setTransfers(transfersData);
      })
      .catch((err) => toast.error("Failed to load inventory: " + err.message))
      .finally(() => setLoading(false));
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !transferIngredient || !transferQty) return;
    setIsTransferring(true);
    try {
      await createTransfer({
        fromBranchId: activeBranchId,
        toBranchId: Number(transferTarget),
        ingredientId: Number(transferIngredient),
        quantity: Number(transferQty)
      });
      toast.success("Transfer requested successfully…");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAcceptTransfer = async (id: number) => {
    try {
      await acceptTransfer(id);
      toast.success("Transfer accepted and stock updated!");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchIngredient || !batchQty) return;
    setIsAddingBatch(true);
    try {
      await addInventoryBatch(activeBranchId!, {
        ingredientId: Number(batchIngredient),
        quantity: Number(batchQty),
        expiryDate: batchExpiry || undefined,
      });
      toast.success("Stock received successfully!");
      setBatchIngredient("");
      setBatchQty("");
      setBatchExpiry("");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAddingBatch(false);
    }
  };

  const handleWaste = async (batchId: number, ingredientId: number, maxQty: number) => {
    const qtyStr = prompt(`How much to discard from this batch? (Max: ${maxQty})`);
    if (!qtyStr) return;
    const qty = Number(qtyStr);
    if (isNaN(qty) || qty <= 0 || qty > maxQty) {
      toast.error("Invalid quantity");
      return;
    }
    const reason = prompt("Reason for waste (e.g. Expired, Spilled):") || "Expired";
    try {
      await reportWaste(activeBranchId!, {
        batchId,
        ingredientId,
        quantity: qty,
        reason
      });
      toast.success("Waste reported successfully.");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const expiry = new Date(dateString).getTime();
    const now = new Date().getTime();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft >= 0;
  };

  if (loading) return <div className="p-10 text-center">Loading Inventory…</div>;

  if (!activeBranchId) {
    return (
      <div className="p-10 text-center text-slate-500">
        Please select a branch to view its inventory.
      </div>
    );
  }

  // Get unique ingredients from branch inventories to populate dropdowns
  const uniqueIngredients = inventories.map(i => i.ingredient);

  return (
    <AnimatedPage className="w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Inventory & Lots</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track raw materials and manage FIFO batches.</p>
        </div>
        
        <div className="flex gap-2">
          {/* Receive Stock Button */}
          <Dialog>
            <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" />}>
              <PackagePlus className="w-4 h-4 mr-2" /> Receive Stock
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive New Batch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBatch} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Ingredient</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    value={batchIngredient} 
                    onChange={(e) => setBatchIngredient(e.target.value)}
                    required
                  >
                    <option value="">Select Ingredient</option>
                    {uniqueIngredients.map((ing: any) => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="0.1" step="0.1" value={batchQty} onChange={(e) => setBatchQty(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input type="date" value={batchExpiry} onChange={(e) => setBatchExpiry(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isAddingBatch}>
                  {isAddingBatch ? "Saving..." : "Save Batch"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />}>
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTransfer} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Ingredient</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    value={transferIngredient} 
                    onChange={(e) => setTransferIngredient(e.target.value)}
                    required
                  >
                    <option value="">Select Ingredient</option>
                    {inventories.filter(i => i.stock > 0).map(i => (
                      <option key={i.ingredient.id} value={i.ingredient.id}>{i.ingredient.name} (Max: {i.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>To Branch</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    value={transferTarget} 
                    onChange={(e) => setTransferTarget(e.target.value)}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.filter(b => b.id !== activeBranchId).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="0.1" step="0.1" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isTransferring}>
                  {isTransferring ? "Processing…" : "Initiate Transfer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
            <span>Total Stock (Aggregated)</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventories.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold">{inv.ingredient.name}</TableCell>
                  <TableCell className="tabular-nums font-mono">{Number(inv.stock).toFixed(2)} {inv.ingredient.unit}</TableCell>
                  <TableCell>
                    {inv.stock <= inv.minStock ? (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2">Low</Badge>
                    ) : <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] uppercase font-bold tracking-wider py-0.5 px-2">Good</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
            <span>Active Batches (FIFO)</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Qty Left</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => {
                const expiring = isExpiringSoon(b.expiryDate);
                const expired = b.expiryDate && new Date(b.expiryDate).getTime() < new Date().getTime();
                return (
                  <TableRow key={b.id}>
                    <TableCell>{b.ingredient.name}</TableCell>
                    <TableCell className="tabular-nums font-mono">{Number(b.quantity).toFixed(2)} {b.ingredient.unit}</TableCell>
                    <TableCell>
                      {b.expiryDate ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            expired ? "text-red-600 dark:text-red-400" : expiring ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                          )}>
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                          {expired ? (
                            <Badge variant="destructive" className="text-[9px] uppercase px-1 py-0">Expired</Badge>
                          ) : expiring ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-[9px] uppercase px-1 py-0">Soon</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No Expiry</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8"
                        onClick={() => handleWaste(b.id, b.ingredientId, b.quantity)}
                        title="Mark as Waste/Expired"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {batches.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 dark:text-slate-500">No active batches</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">Pending Transfers</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.fromBranch.name}</TableCell>
                <TableCell>{t.toBranch.name}</TableCell>
                <TableCell>{t.ingredient.name}</TableCell>
                <TableCell className="tabular-nums font-mono">{t.quantity}</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'COMPLETED' ? 'default' : 'secondary'} className={cn(
                    "text-[10px] uppercase font-bold tracking-wider py-0.5 px-2",
                    t.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''
                  )}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.status === 'PENDING' && t.toBranchId === activeBranchId && (
                    <Button size="sm" variant="outline" className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" onClick={() => handleAcceptTransfer(t.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                    </Button>
                  )}
                  {t.status === 'PENDING' && t.fromBranchId === activeBranchId && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Waiting for {t.toBranch.name}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {transfers.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-slate-400 dark:text-slate-500">No transfers history</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AnimatedPage>
  );
}
