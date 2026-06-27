"use client";

import { useState } from "react";
import { useHrUsers, useCreateUser, useUpdateUser } from "@/hooks/domains/useHrQueries";
import { useBranches } from "@/hooks/domains/useGeneralQueries";
import { AnimatedPage } from "@/components/animated-page";
import { HubPageHeader } from "@/components/shared/hub-card";
import { AccessDeniedState } from "@/components/shared/access-denied-state";
import { ShieldCheck, Plus, User as UserIcon, Mail, Shield, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag, Button as AntButton } from "antd";
import { DataTable } from "@/components/shared/data-table";
import { RoleGuard } from "@/components/RoleGuard";
import type { User, Branch, CreateUserPayload, Role, EmploymentType } from "@/types/api";
import { getErrorMessage } from "@/lib/errors";

export default function UsersPage() {
  const { data: users, isLoading: usersLoading } = useHrUsers();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    branchId: 0,
    employmentType: "PART_TIME",
    hourlyRate: 0,
    baseSalary: 0
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Never populate password
      role: user.role || "STAFF",
      branchId: user.branchId || 0,
      employmentType: user.employmentType || "PART_TIME",
      hourlyRate: user.hourlyRate || 0,
      baseSalary: user.baseSalary || 0
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ 
      name: "", email: "", password: "", role: "STAFF", branchId: 0, employmentType: "PART_TIME", hourlyRate: 50, baseSalary: 0 
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload: CreateUserPayload = {
        ...formData,
        role: formData.role as Role,
        employmentType: formData.employmentType as EmploymentType,
        branchId: formData.branchId === 0 ? null : formData.branchId,
      };
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, ...payload });
        toast.success("User updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("User created successfully");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save user"));
    }
  };


  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']} fallback={<AccessDeniedState description="Super Admin access is required to manage users and roles." />}>
    <AnimatedPage className="space-y-6 max-w-6xl mx-auto w-full">
      <HubPageHeader
        title="Users & Roles"
        icon={ShieldCheck}
        description="Manage system access, passwords, and branch assignments."
        actions={
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4" />
            Add New User
          </Button>
        }
      />

      <DataTable
        loading={usersLoading || branchesLoading}
          columns={[
            {
              title: "User",
              key: "user",
              render: (_, record: User) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{record.name || 'Unnamed User'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {record.email}
                    </div>
                  </div>
                </div>
              )
            },
            {
              title: "Role",
              dataIndex: "role",
              key: "role",
              render: (role) => (
                <Tag color={
                  role === 'SUPER_ADMIN' ? 'purple' : 
                  role === 'MANAGER' ? 'blue' : 
                  'default'
                }>
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    {role}
                  </div>
                </Tag>
              )
            },
            {
              title: "Branch",
              key: "branch",
              render: (_, record: User) => {
                const branchName = (branches as Branch[] | undefined)?.find((b) => b.id === record.branchId)?.name || "All Branches (HQ)";
                return (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Building className="w-4 h-4 text-slate-400" />
                    {branchName}
                  </div>
                );
              }
            },
            {
              title: "Employment",
              key: "employment",
              render: (_, record: User) => (
                <div className="text-slate-600 dark:text-slate-300">
                  {record.employmentType ? record.employmentType.replace('_', ' ') : 'N/A'}
                </div>
              )
            },
            {
              title: "Actions",
              key: "actions",
              align: "right",
              render: (_, record: User) => (
                <AntButton type="link" onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-700 font-medium">
                  Edit Profile
                </AntButton>
              )
            }
          ]}
          dataSource={users || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          emptyDescription="No users found."
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User Account" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Somchai Jai-dee" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="somchai@qafacafe.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password {editingUser && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}</Label>
              <Input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "••••••••" : "e.g. qafa1234"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Role</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="STAFF">Staff (POS & basic apps)</option>
                  <option value="MANAGER">Manager (Approvals & Reports)</option>
                  <option value="SUPER_ADMIN">Super Admin (All Access)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Branch</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.branchId || 0}
                  onChange={(e) => setFormData({...formData, branchId: Number(e.target.value)})}
                >
                  <option value={0}>All Branches (HQ / Admin)</option>
                  {(branches as Branch[] | undefined)?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                >
                  <option value="PART_TIME">Part-Time (Hourly)</option>
                  <option value="FULL_TIME">Full-Time (Salaried)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{formData.employmentType === 'PART_TIME' ? 'Hourly Rate (฿)' : 'Monthly Base Salary (฿)'}</Label>
                <Input 
                  type="number" 
                  value={formData.employmentType === 'PART_TIME' ? formData.hourlyRate : formData.baseSalary} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (formData.employmentType === 'PART_TIME') setFormData({...formData, hourlyRate: val});
                    else setFormData({...formData, baseSalary: val});
                  }} 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
    </RoleGuard>
  );
}
