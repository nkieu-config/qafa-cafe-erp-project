"use client";

import { useState } from "react";
import { useBranches, useCreateBranch, useUpdateBranch } from "@/hooks/domains/useGeneralQueries";
import { AnimatedPage } from "@/components/animated-page";
import { HubPageHeader } from "@/components/shared/hub-card";
import { Building2, Plus, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Branch } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";

export default function BranchesPage() {
  const { data: branches, isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    isCentralKitchen: false
  });

  const branchList = (branches as Branch[] | undefined) || [];

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location || "",
      isCentralKitchen: branch.isCentralKitchen ?? false
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setFormData({ name: "", location: "", isCentralKitchen: false });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Branch name is required");
      return;
    }

    try {
      if (editingBranch) {
        await updateMutation.mutateAsync({ id: editingBranch.id, ...formData });
        toast.success("Branch updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Branch created successfully");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save branch"));
    }
  };

  return (
    <AnimatedPage className="space-y-6 max-w-5xl mx-auto w-full">
      <HubPageHeader
        title="Branch Management"
        icon={Building2}
        description="Manage all franchise locations and central kitchens."
        actions={
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4" />
            Add New Branch
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : branchList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Building2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="font-semibold text-slate-800 dark:text-slate-100">No branches yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Create your first branch or central kitchen to start assigning staff and inventory.
          </p>
          <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" /> Add first branch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branchList.map((branch) => (
            <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {branch.location || "No location specified"}
                  </p>
                </div>
                {branch.isCentralKitchen ? (
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">HQ / Kitchen</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-600 dark:text-slate-300">Franchise</Badge>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  ID: #{branch.id}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(branch)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch Details" : "Create New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Qafa Siam Square"
              />
            </div>
            <div className="space-y-2">
              <Label>Location / Address</Label>
              <Input 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
                placeholder="e.g. 1st Floor, Center Point"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="isCentralKitchen" 
                checked={formData.isCentralKitchen}
                onCheckedChange={(checked) => setFormData({...formData, isCentralKitchen: !!checked})}
              />
              <Label htmlFor="isCentralKitchen" className="font-normal">
                This branch is a Central Kitchen (HQ)
              </Label>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
