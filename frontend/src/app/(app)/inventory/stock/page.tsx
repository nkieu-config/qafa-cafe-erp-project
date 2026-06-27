"use client";

import { useState } from "react";
import { useBranchDetails, useAddInventoryBatch, useReportWaste } from '@/hooks/domains/useInventoryQueries';
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Table, Tag, Button as AntButton, Popconfirm, Calendar, Popover, Badge } from "antd";
import { PackageOpen, PackagePlus, Trash2, CalendarDays, AlertCircle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { HubPageHeader } from "@/components/shared/hub-card";
import { DataTable } from "@/components/shared/data-table"
import { format, differenceInDays } from "date-fns";
import type { Dayjs } from "dayjs";
import type { Ingredient, InventoryBatch, PurchaseOrder, Supplier, BranchInventory } from "@/types/api";

type InventoryWithIngredient = BranchInventory & { ingredient: Ingredient };
type BatchWithSupplier = InventoryBatch & { purchaseOrder?: PurchaseOrder & { supplier?: Supplier } };

export default function InventoryPage() {
  const { activeBranchId } = useAuth();

  const { data: branchDetails, isLoading: loadingBranch } = useBranchDetails(activeBranchId ?? undefined);
  const inventories: InventoryWithIngredient[] = branchDetails?.inventories || [];
  const batches: BatchWithSupplier[] = branchDetails?.inventoryBatches || [];

  const loading = loadingBranch;

  const addBatchMutation = useAddInventoryBatch();
  const reportWasteMutation = useReportWaste();
  // Batch Form State
  const [batchIngredient, setBatchIngredient] = useState("");
  const [batchQty, setBatchQty] = useState("");
  const [batchExpiry, setBatchExpiry] = useState("");
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'month' | 'year'>('month');
  const [wasteTarget, setWasteTarget] = useState<{
    batchId: number;
    ingredientId: number;
    maxQty: number;
    ingredientName: string;
  } | null>(null);
  const [wasteQty, setWasteQty] = useState("");
  const [wasteReason, setWasteReason] = useState("Expired");
  const [isWasteOpen, setIsWasteOpen] = useState(false);

  // Removed useEffect and fetchInventory, handled by React Query

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchIngredient || !batchQty) return;
    setIsAddingBatch(true);
    try {
      if (activeBranchId) {
        await addBatchMutation.mutateAsync({
          branchId: activeBranchId,
          data: {
            ingredientId: Number(batchIngredient),
            quantity: Number(batchQty),
            expiryDate: batchExpiry
          }
        });
        toast.success("Inventory batch added successfully");
        setIsAddingBatch(false);
        setBatchIngredient("");
        setBatchQty("");
        setBatchExpiry("");
      }
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      setIsAddingBatch(false);
    }
  };

  const openWasteDialog = (
    batchId: number,
    ingredientId: number,
    maxQty: number,
    ingredientName: string,
  ) => {
    setWasteTarget({ batchId, ingredientId, maxQty, ingredientName });
    setWasteQty(String(maxQty));
    setWasteReason("Expired");
    setIsWasteOpen(true);
  };

  const handleWasteSubmit = async () => {
    if (!wasteTarget || !activeBranchId) return;
    const qty = Number(wasteQty);
    if (isNaN(qty) || qty <= 0 || qty > wasteTarget.maxQty) {
      toast.error(`Enter a quantity between 0 and ${wasteTarget.maxQty}`);
      return;
    }
    if (!wasteReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    try {
      await reportWasteMutation.mutateAsync({
        branchId: activeBranchId,
        data: {
          batchId: wasteTarget.batchId,
          ingredientId: wasteTarget.ingredientId,
          quantity: qty,
          reason: wasteReason.trim(),
        },
      });
      toast.success("Waste reported successfully.");
      setIsWasteOpen(false);
      setWasteTarget(null);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const expiry = new Date(dateString).getTime();
    const now = new Date().getTime();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft >= 0;
  };

  // Pre-process batches for Heatmap
  const expiryMap = batches.reduce((acc: Record<string, BatchWithSupplier[]>, batch: BatchWithSupplier) => {
    if (!batch.expiryDate) return acc;
    const dateStr = format(new Date(batch.expiryDate), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(batch);
    return acc;
  }, {});

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const expiringBatches = expiryMap[dateStr];
    if (!expiringBatches) return null;

    const daysLeft = differenceInDays(value.toDate(), new Date());
    
    let colorClass = "bg-slate-200 text-slate-800";
    let title = "Expired";
    if (daysLeft >= 0 && daysLeft <= 1) {
      colorClass = "bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-md";
      title = "Critical";
    } else if (daysLeft > 1 && daysLeft <= 3) {
      colorClass = "bg-orange-500 text-white shadow-orange-500/30 shadow-md";
      title = "Warning";
    } else if (daysLeft > 3 && daysLeft <= 7) {
      colorClass = "bg-amber-400 text-amber-950";
      title = "Notice";
    } else if (daysLeft > 7) {
      colorClass = "bg-emerald-100 text-emerald-800";
      title = "Safe";
    }

    const popoverContent = (
      <div className="max-w-xs space-y-2">
        <div className="font-black text-slate-800 border-b pb-1 mb-2">Expiring Items</div>
        {expiringBatches.map((b) => (
          <div key={b.id} className="flex justify-between items-center text-sm gap-4">
            <span className="font-semibold text-slate-700">{b.ingredient?.name}</span>
            <span className="font-mono bg-slate-100 px-1 rounded">{b.quantity} {b.ingredient?.unit}</span>
          </div>
        ))}
      </div>
    );

    return (
      <Popover content={popoverContent} title={null} trigger="hover">
        <div className={cn("w-full h-full flex flex-col items-center justify-center rounded-lg p-1 mt-1 cursor-pointer transition-transform hover:scale-110", colorClass)}>
          <AlertCircle className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-black leading-none">{expiringBatches.length} Items</span>
        </div>
      </Popover>
    );
  };

  // AntD Main Columns
  const inventoryColumns = [
    { 
      title: 'Ingredient Name', 
      key: 'name',
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) => a.ingredient.name.localeCompare(b.ingredient.name),
      render: (_: unknown, record: InventoryWithIngredient) => (
        <div className="font-bold text-slate-800 dark:text-slate-200">{record.ingredient.name}</div>
      )
    },
    { 
      title: 'Current Stock', 
      key: 'stock',
      sorter: (a: InventoryWithIngredient, b: InventoryWithIngredient) => a.stock - b.stock,
      render: (_: unknown, record: InventoryWithIngredient) => (
        <span className="tabular-nums font-mono">
          {Number(record.stock).toFixed(2)} {record.ingredient.unit}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: InventoryWithIngredient) => {
        if (record.stock <= record.minStock) {
          return <Tag color="error">LOW STOCK</Tag>;
        }
        return <Tag color="success">GOOD</Tag>;
      },
    },
  ];

  // AntD Expanded Row Renderer
  const expandedRowRender = (record: InventoryWithIngredient) => {
    const ingredientId = record.ingredient.id;
    const ingredientBatches = batches.filter((b: BatchWithSupplier) => b.ingredientId === ingredientId);

    const batchColumns = [
      { title: 'Batch ID', dataIndex: 'id', key: 'id' },
      { 
        title: 'Supplier', 
        key: 'supplier',
        render: (_: unknown, b: BatchWithSupplier) => (
          <span>{b.purchaseOrder?.supplier?.name || '-'}</span>
        )
      },
      { 
        title: 'Quantity (Units)', 
        key: 'quantity',
        render: (_: unknown, b: BatchWithSupplier) => (
          <span className="tabular-nums font-mono font-medium">{Number(b.quantity).toFixed(2)} {record.ingredient.unit}</span>
        ),
      },
      {
        title: 'Expiry Date',
        key: 'expiryDate',
        render: (_: unknown, b: BatchWithSupplier) => {
          if (!b.expiryDate) return <span className="text-xs text-slate-400">No Expiry</span>;
          const expiring = isExpiringSoon(b.expiryDate ?? null);
          const expired = new Date(b.expiryDate).getTime() < new Date().getTime();
          return (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium",
                expired ? "text-red-600" : expiring ? "text-amber-600" : "text-slate-600 dark:text-slate-400"
              )}>
                {format(new Date(b.expiryDate), 'dd MMM yyyy')}
              </span>
              {expired ? (
                <Tag color="error" className="ml-2">Expired</Tag>
              ) : expiring ? (
                <Tag color="warning" className="ml-2">Soon</Tag>
              ) : null}
            </div>
          );
        }
      },
      {
        title: 'Action',
        key: 'action',
        render: (_: unknown, b: BatchWithSupplier) => (
          <AntButton 
            type="text" 
            danger
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() =>
              openWasteDialog(
                b.id,
                b.ingredientId,
                b.quantity,
                record.ingredient.name,
              )
            }
            title="Mark as Waste/Expired"
          />
        ),
      },
    ];

    return (
      <DataTable 
        columns={batchColumns} 
        dataSource={ingredientBatches} 
        rowKey="id"
        pagination={false} 
        size="small"
        hideBorders
      />
    );
  };

  // Transfers handled by shared StockTransfersPanel

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to manage batches and expiry." />
    );
  }

  const uniqueIngredients = inventories.map(i => i.ingredient);

  return (
    <div className="w-full space-y-6">
      <HubPageHeader
        title="Stock & Batches"
        icon={PackageOpen}
        description="Manage inventory batches, expiry tracking, and waste disposal."
        actions={
        <Dialog>
          <DialogTrigger render={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold">
              <PackagePlus className="w-4 h-4 mr-2" /> Receive Stock
            </Button>
          } />
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black text-xl">Receive New Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBatch} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Ingredient</Label>
                <select 
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  value={batchIngredient} 
                  onChange={(e) => setBatchIngredient(e.target.value)}
                  required
                >
                  <option value="">Select Ingredient</option>
                  {uniqueIngredients.map((inv: Ingredient) => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Quantity</Label>
                <Input className="h-11 rounded-xl bg-slate-50" type="number" min="0.1" step="0.1" value={batchQty} onChange={(e) => setBatchQty(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Expiry Date (Optional)</Label>
                <Input className="h-11 rounded-xl bg-slate-50" type="date" value={batchExpiry} onChange={(e) => setBatchExpiry(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold rounded-xl" disabled={isAddingBatch}>
                {isAddingBatch ? "Saving..." : "Save Batch"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <Dialog open={isWasteOpen} onOpenChange={setIsWasteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Report Batch Waste</DialogTitle>
            <DialogDescription>
              {wasteTarget
                ? `Discard from ${wasteTarget.ingredientName} (max ${wasteTarget.maxQty})`
                : "Record waste for this batch"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-bold">Quantity</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={wasteTarget?.maxQty}
                value={wasteQty}
                onChange={(e) => setWasteQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Reason</Label>
              <Input
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                placeholder="Expired, Spilled, etc."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsWasteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => void handleWasteSubmit()}
              disabled={reportWasteMutation.isPending}
            >
              {reportWasteMutation.isPending ? "Saving..." : "Confirm Waste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 h-full">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-t-xl font-black text-rose-800 dark:text-rose-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-500" />
              Expiry Heatmap
            </div>
            <div className="p-4">
              <Calendar 
                fullscreen={false}
                mode={calendarMode}
                onPanelChange={(_, mode) => {
                  // Expiry heatmap is day-level only; prevent broken year panel UI
                  setCalendarMode(mode === 'year' ? 'month' : mode);
                }}
                cellRender={(current, info) => {
                  if (info.type === 'date') return dateCellRender(current);
                  return info.originNode;
                }} 
                className="rounded-xl border border-slate-100 overflow-hidden [&_.ant-picker-calendar-date-value]:font-bold [&_.ant-picker-calendar-date-value]:text-slate-600"
              />
              <div className="mt-6 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500"></div> Critical (0-1 Days)</div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500"></div> Warning (2-3 Days)</div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Notice (4-7 Days)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="pt-2">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-emerald-500" /> Aggregated Stock & Batches
            </h2>
            <DataTable 
              loading={loading}
              columns={inventoryColumns} 
              dataSource={inventories} 
              rowKey="id"
              expandable={{ expandedRowRender }}
              pagination={{ pageSize: 5 }}
            />
          </div>

          <Link
            href="/procurement/transfers"
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Stock Transfers</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Request and accept transfers between branches
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
              Open →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
