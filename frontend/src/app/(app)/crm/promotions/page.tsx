"use client";

import { useState } from "react";
import { usePromotions, useCreatePromotion, useTogglePromotion } from '@/hooks/domains/useCrmQueries';
import { Badge } from "@/components/ui/badge";
import { TicketPercent, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HubCard } from "@/components/shared/hub-card";
import { DataTable } from "@/components/shared/data-table";
import { Promotion } from "@/types/api";

export default function PromotionsPage() {
  const { data: promotionsData, isLoading: loading } = usePromotions();
  const promotions = promotionsData || [];

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const createMutation = useCreatePromotion();
  const toggleMutation = useTogglePromotion();

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !description || !discountValue) return;
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({ 
        code: code.toUpperCase(), 
        description, 
        discountType, 
        discountValue: Number(discountValue),
        minPurchase: minPurchase ? Number(minPurchase) : undefined,
        isActive: true
      });
      toast.success("Promotion created successfully…");
      setOpen(false);
      setCode("");
      setDescription("");
      setDiscountValue("");
      setMinPurchase("");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !currentStatus });
      toast.success("Promotion status updated");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };



  return (
    <HubCard
      title="Promotions & Discounts"
      icon={TicketPercent}
      description="Manage active promotion codes and percentage discounts."
      actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" /> New Promo Code
            </Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Promotion Code</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePromo} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Code (e.g. SUMMER20)</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (THB)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Purchase (Optional)</Label>
                  <Input type="number" min="0" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="0" />
                </div>
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create Promotion"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
    >
      <DataTable 
        columns={[
          {
            title: "Status",
            dataIndex: "isActive",
            key: "status",
            render: (isActive: boolean, record: Promotion) => (
              <Switch 
                checked={isActive} 
                onCheckedChange={() => handleToggle(record.id, isActive)} 
              />
            )
          },
          { title: "Code", dataIndex: "code", key: "code", render: (code: string) => <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{code}</span> },
          { title: "Description", dataIndex: "description", key: "desc" },
          { 
            title: "Discount", 
            key: "discount",
            render: (_, record: Promotion) => (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {record.discountType === 'PERCENTAGE' ? `${record.discountValue}%` : `฿${record.discountValue}`}
              </span>
            )
          },
          { 
            title: "Min Purchase", 
            dataIndex: "minPurchase", 
            key: "minPurchase",
            render: (min: number | null) => <span className="text-slate-500 dark:text-slate-400">{min ? `฿${min}` : 'None'}</span>
          }
        ]}
        dataSource={promotions}
        rowKey="id"
        loading={loading}
      />
    </HubCard>
  );
}
