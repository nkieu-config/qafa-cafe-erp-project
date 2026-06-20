"use client";

import { useEffect, useState } from "react";
import { getEquipment, createEquipment, logMaintenance } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function EquipmentPage() {
  const { activeBranchId } = useAuth();
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("ESPRESSO_MACHINE");
  const [serial, setSerial] = useState("");
  
  const [maintDesc, setMaintDesc] = useState("");
  const [maintCost, setMaintCost] = useState("");
  const [maintNextDate, setMaintNextDate] = useState("");
  const [selectedEqId, setSelectedEqId] = useState<number | null>(null);

  useEffect(() => {
    loadEquipment();
  }, [activeBranchId]);

  const loadEquipment = async () => {
    try {
      const data = await getEquipment(activeBranchId || undefined);
      setEquipmentList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEquipment({
        branchId: activeBranchId,
        name,
        type,
        serialNumber: serial
      });
      toast.success("Equipment registered successfully!");
      setName(""); setSerial("");
      loadEquipment();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) return;
    try {
      await logMaintenance(selectedEqId, {
        description: maintDesc,
        cost: Number(maintCost),
        nextMaintenanceDate: maintNextDate || undefined,
        newStatus: 'ACTIVE'
      });
      toast.success("Maintenance logged successfully!");
      setMaintDesc(""); setMaintCost(""); setMaintNextDate("");
      setSelectedEqId(null);
      loadEquipment();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Equipment...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Equipment Maintenance</h1>
          <p className="text-slate-500 dark:text-slate-400">Track machines, appliances, and schedule preventative maintenance.</p>
        </div>
        <Dialog>
          <DialogTrigger>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Equipment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Equipment Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. La Marzocco Linea PB" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border px-3" value={type} onChange={e => setType(e.target.value)}>
                  <option value="ESPRESSO_MACHINE">Espresso Machine</option>
                  <option value="GRINDER">Grinder</option>
                  <option value="BLENDER">Blender</option>
                  <option value="POS_SYSTEM">POS System</option>
                  <option value="REFRIGERATOR">Refrigerator</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input value={serial} onChange={e => setSerial(e.target.value)} placeholder="e.g. SN-12345" />
              </div>
              <Button type="submit" className="w-full bg-blue-600">Register</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentList.map((eq) => {
                const nextDate = eq.nextMaintenanceDate ? new Date(eq.nextMaintenanceDate) : null;
                const isOverdue = nextDate && nextDate.getTime() < Date.now();
                
                return (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">
                      <div>{eq.name}</div>
                      <div className="text-xs text-slate-400">SN: {eq.serialNumber || 'N/A'}</div>
                    </TableCell>
                    <TableCell>{eq.type.replace('_', ' ')}</TableCell>
                    <TableCell>{eq.branch?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        eq.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        eq.status === 'MAINTENANCE' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {eq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                            {nextDate.toLocaleDateString()}
                          </span>
                          {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        </div>
                      ) : <span className="text-slate-400">Not scheduled</span>}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger>
                          <Button size="sm" variant="outline" onClick={() => setSelectedEqId(eq.id)}>
                            <Wrench className="w-4 h-4 mr-2" />
                            Log Maint.
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Log Maintenance for {eq.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleLogMaintenance} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Input value={maintDesc} onChange={e => setMaintDesc(e.target.value)} required placeholder="e.g. Replaced gaskets and backflushed" />
                            </div>
                            <div className="space-y-2">
                              <Label>Cost (THB)</Label>
                              <Input type="number" value={maintCost} onChange={e => setMaintCost(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Schedule Next Maintenance (Optional)</Label>
                              <Input type="date" value={maintNextDate} onChange={e => setMaintNextDate(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full">Save Log</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
              {equipmentList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">No equipment registered.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
