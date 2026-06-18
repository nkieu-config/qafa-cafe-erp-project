"use client";

import { useEffect, useState } from "react";
import { getPromotions, createPromotion, togglePromotion } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TicketPercent, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = () => {
    setLoading(true);
    getPromotions()
      .then(setPromotions)
      .catch((err) => toast.error("Failed to load promotions: " + err.message))
      .finally(() => setLoading(false));
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !description || !discountValue) return;
    setIsSubmitting(true);
    try {
      await createPromotion({ 
        code: code.toUpperCase(), 
        description, 
        discountType, 
        discountValue: Number(discountValue),
        minPurchase: minPurchase ? Number(minPurchase) : undefined
      });
      toast.success("Promotion created successfully!");
      setOpen(false);
      setCode("");
      setDescription("");
      setDiscountValue("");
      setMinPurchase("");
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await togglePromotion(id, !currentStatus);
      toast.success("Promotion status updated");
      fetchPromotions();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  }

  if (loading) return <div className="p-10 text-center">Loading Promotions...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-2">
            <TicketPercent className="text-pink-600" /> Promotions
          </h1>
          <p className="text-slate-500">Manage discount codes and marketing campaigns.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" /> New Promo Code
            </Button>
          </DialogTrigger>
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
                    onChange={(e) => setDiscountType(e.target.value)}
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
                {isSubmitting ? "Creating..." : "Create Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Switch 
                    checked={p.isActive} 
                    onCheckedChange={() => handleToggle(p.id, p.isActive)} 
                  />
                </TableCell>
                <TableCell className="font-mono font-bold text-slate-700">{p.code}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell className="font-semibold text-emerald-600">
                  {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `฿${p.discountValue}`}
                </TableCell>
                <TableCell className="text-slate-500">
                  {p.minPurchase ? `฿${p.minPurchase}` : 'None'}
                </TableCell>
              </TableRow>
            ))}
            {promotions.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No promotions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
