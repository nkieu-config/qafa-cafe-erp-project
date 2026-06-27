"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHrUsers, useUpdateHourlyRate } from '@/hooks/domains/useHrQueries';
import { Table, Tag, Typography, Button as AntButton, Form, InputNumber, Avatar } from "antd";
import { Users, UserCog, Edit3 } from "lucide-react";
import { FormModal } from "@/components/shared/form-modal";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { User, Branch } from "@/types/api";
import { formatBaht } from "@/lib/money";

const { Text } = Typography;

export default function EmployeeDirectoryPage() {
  const { user, activeBranchId } = useAuth();
  const role = user?.role;
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  
  const { data: usersData, isLoading } = useHrUsers(branchIdNum);
  const updateHourlyRateMutation = useUpdateHourlyRate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const employees = usersData || [];

  const handleEditRate = (record: User) => {
    setSelectedUser(record);
    form.setFieldsValue({ hourlyRate: record.hourlyRate });
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (values: { hourlyRate: number }) => {
    if (!selectedUser) return;
    try {
      await updateHourlyRateMutation.mutateAsync({ userId: selectedUser.id, hourlyRate: values.hourlyRate });
      toast.success("Hourly rate updated successfully");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update hourly rate"));
    }
  };

  const getRoleColor = (r: string) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'magenta';
      case 'MANAGER': return 'purple';
      case 'STAFF': return 'blue';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-violet-500 font-bold">{record.name?.charAt(0) || 'U'}</Avatar>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">{record.name || 'Unknown User'}</div>
            <div className="text-xs text-slate-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <Tag color={getRoleColor(text)} className="font-bold rounded-md border-0">{text}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'employmentType',
      key: 'type',
      render: (text: string) => <Text className="text-slate-600">{text ? text.replace('_', ' ') : 'N/A'}</Text>
    },
    {
      title: 'Branch',
      dataIndex: ['branch', 'name'],
      key: 'branch',
      render: (text: string) => text ? <Tag>{text}</Tag> : <Text type="secondary">HQ / All</Text>
    },
    {
      title: 'Hourly Rate',
      dataIndex: 'hourlyRate',
      key: 'rate',
      align: 'right' as const,
      render: (val: number | string) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {formatBaht(val)} / hr
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, record: User) => {
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
          return (
            <AntButton 
              type="text" 
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" 
              icon={<Edit3 className="w-4 h-4" />}
              onClick={() => handleEditRate(record)}
            >
              Edit Rate
            </AntButton>
          )
        }
        return null;
      }
    }
  ];

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view the employee directory." />
    );
  }

  return (
    <>
      <HubCard
        title="Employee Directory"
        icon={Users}
        description="View staff details and manage compensation rates."
      >
      <DataTable 
        columns={columns} 
        dataSource={employees} 
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />
      </HubCard>

      <FormModal
        title="Edit Compensation"
        icon={UserCog}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null); }}
      >
        <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
           <Avatar size="large" className="bg-violet-500 font-bold">{selectedUser?.name?.charAt(0)}</Avatar>
           <div>
             <div className="font-bold">{selectedUser?.name}</div>
             <div className="text-sm text-slate-500">{selectedUser?.role}</div>
           </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateSubmit}
        >
          <Form.Item 
            label="Hourly Rate (฿)" 
            name="hourlyRate" 
            rules={[{ required: true, message: 'Hourly rate is required' }]}
            extra="This rate is used to calculate payroll based on total clocked hours."
          >
            <InputNumber 
              className="w-full h-10 pt-1" 
              min={0} 
              step={1} 
              prefix="฿" 
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-8">
            <AntButton onClick={() => { setIsModalOpen(false); setSelectedUser(null); }}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-indigo-600" loading={updateHourlyRateMutation.isPending}>
              Save Changes
            </AntButton>
          </div>
        </Form>
      </FormModal>
    </>
  );
}
