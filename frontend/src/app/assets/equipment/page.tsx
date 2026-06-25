"use client";

import { useState } from "react";
import { useEquipment, useCreateEquipment, useLogMaintenance } from '@/hooks/domains/useProcurementQueries';
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, AlertTriangle, Coffee } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { AnimatedPage } from "@/components/animated-page";
import { Equipment, Branch } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function EquipmentPage() {
  const { activeBranchId } = useAuth();
  const { data: equipmentData, isLoading: loading } = useEquipment(activeBranchId ?? undefined);
  const equipmentList = equipmentData || [];

  const createMutation = useCreateEquipment();
  const maintMutation = useLogMaintenance();

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("ESPRESSO_MACHINE");
  const [serial, setSerial] = useState("");
  
  const [maintDesc, setMaintDesc] = useState("");
  const [maintCost, setMaintCost] = useState("");
  const [maintNextDate, setMaintNextDate] = useState("");
  const [selectedEqId, setSelectedEqId] = useState<number | null>(null);

  // Removed manual loadEquipment

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranchId) return toast.error("Please select a branch first");
    try {
      await createMutation.mutateAsync({
        branchId: activeBranchId,
        name,
        type,
        status: "OPERATIONAL"
      });
      toast.success("Equipment registered successfully!");
      setName(""); setSerial("");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) return;
    try {
      await maintMutation.mutateAsync({
        id: selectedEqId,
        data: {
          description: maintDesc,
          cost: Number(maintCost),
          performedBy: "Admin",
          date: new Date().toISOString()
        }
      });
      toast.success("Maintenance logged successfully!");
      setMaintDesc(""); setMaintCost(""); setMaintNextDate("");
      setSelectedEqId(null);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };



  return (
    <div className="space-y-6">
      <PageHeader 
        title="Equipment Maintenance"
        icon={Coffee}
        description="Track machines, appliances, and schedule preventative maintenance."
        actions={
          <Dialog>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Register Equipment
          </Button>} />
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
      }
      />

      <DataTable 
        loading={loading}
        columns={[
          { title: "Name", dataIndex: "name", key: "name", render: (text: string) => <span className="font-medium">{text}</span> },
          { title: "Type", dataIndex: "type", key: "type", render: (type: string) => type.replace('_', ' ') },
          { title: "Branch", dataIndex: "branch", key: "branch", render: (branch: Branch) => branch?.name },
          { 
            title: "Status", 
            dataIndex: "status", 
            key: "status",
            render: (status: string) => (
              <Badge className={cn(
                status === "OPERATIONAL" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30",
                status === "NEEDS_MAINTENANCE" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30",
                status === "OUT_OF_ORDER" && "bg-rose-100 text-rose-800 dark:bg-rose-900/30",
              )}>
                {status.replace('_', ' ')}
              </Badge>
            )
          },
          { 
            title: "Next Maintenance", 
            dataIndex: "nextMaintenanceDate", 
            key: "nextMaintenanceDate",
            render: (date: string) => date ? new Date(date).toLocaleDateString() : "-"
          },
          { 
            title: "Action", 
            key: "action",
            render: (_, record: Equipment) => (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" onClick={() => setSelectedEqId(record.id)}>
                  <Wrench className="w-4 h-4 mr-2" /> Log Maintenance
                </Button>} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Maintenance for {record.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleLogMaintenance} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={maintDesc} onChange={e => setMaintDesc(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost (THB)</Label>
                      <Input type="number" value={maintCost} onChange={e => setMaintCost(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Maintenance Date</Label>
                      <Input type="date" value={maintNextDate} onChange={e => setMaintNextDate(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full">Save Record</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )
          }
        ]}
        dataSource={equipmentList}
        rowKey="id"
      />
    </div>
  );
}
