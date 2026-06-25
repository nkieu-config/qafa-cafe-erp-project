"use client";

import { useState } from "react";
import { useTransfers, useCreateTransfer, useAcceptTransfer } from '@/hooks/domains/useProcurementQueries';
import { useBranches } from '@/hooks/domains/useGeneralQueries';
import { useIngredients } from '@/hooks/domains/useProductionQueries';
import { useAuth } from "@/context/AuthContext";
import { Table, Tag, Button as AntButton, Form, Select, InputNumber, Popconfirm } from "antd";
import { FormModal } from "@/components/shared/form-modal";
import { Plus, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StockTransfer, Branch, Ingredient, User } from "@/types/api";
import { format } from "date-fns";

export default function TransfersPage() {
  const { user, activeBranchId } = useAuth();
  
  // Super admin can see all if activeBranchId is null
  const { data: transfersData, isLoading: loadingTransfers } = useTransfers(activeBranchId ?? undefined);
  const { data: branchesData, isLoading: loadingBranches } = useBranches();
  const { data: ingredientsData, isLoading: loadingIng } = useIngredients();

  const transfers = transfersData || [];
  const branches = branchesData || [];
  const ingredients = ingredientsData || [];

  const loading = loadingTransfers || loadingBranches || loadingIng;

  const createMutation = useCreateTransfer();
  const acceptMutation = useAcceptTransfer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleCreateSubmit = async (values: any) => {
    if (!activeBranchId && !values.toBranchId) {
      toast.error("Please select a target branch");
      return;
    }
    
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        fromBranchId: values.fromBranchId,
        toBranchId: activeBranchId || values.toBranchId,
        ingredientId: values.ingredientId,
        quantity: values.quantity
      });
      toast.success("Transfer requested successfully");
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message || "Failed to request transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (transferId: number) => {
    try {
      await acceptMutation.mutateAsync(transferId);
      toast.success("Transfer accepted! Inventory has been updated.");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to accept transfer");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "PENDING": return "warning";
      case "CANCELLED": return "error";
      default: return "default";
    }
  };

  const canAccept = (transfer: StockTransfer) => {
    // A transfer can be accepted by the ToBranch manager, or SUPER_ADMIN
    if (transfer.status !== 'PENDING') return false;
    if (user?.role === 'SUPER_ADMIN') return true;
    if (activeBranchId && transfer.toBranchId === activeBranchId) return true;
    return false;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="font-medium text-slate-700">{format(new Date(date), 'dd MMM yyyy HH:mm')}</span>,
    },
    {
      title: 'From (Source)',
      dataIndex: ['fromBranch', 'name'],
      key: 'fromBranch',
      render: (text: string) => <Tag color="blue">{text || 'HQ'}</Tag>
    },
    {
      title: 'To (Destination)',
      dataIndex: ['toBranch', 'name'],
      key: 'toBranch',
      render: (text: string) => <Tag color="cyan">{text}</Tag>
    },
    {
      title: 'Ingredient',
      dataIndex: ['ingredient', 'name'],
      key: 'ingredient',
      render: (text: string, record: StockTransfer & { ingredient: Ingredient }) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {text} <span className="text-slate-400 font-normal">({record.quantity} {record.ingredient?.unit})</span>
        </span>
      )
    },
    {
      title: 'Requested By',
      dataIndex: ['requestedBy', 'name'],
      key: 'requestedBy',
      render: (text: string) => <span className="text-slate-500">{text}</span>
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: any) => (
        <Tag color={getStatusColor(record.status)} className="px-2 py-0.5 rounded-md font-bold tracking-wide">
          {record.status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, record: any) => (
        <div className="flex justify-end gap-2">
          {canAccept(record) && (
            <Popconfirm title="Confirm receiving this stock transfer?" onConfirm={() => handleAccept(record.id)}>
              <AntButton type="primary" className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold" size="small" icon={<CheckCircle2 className="w-3 h-3" />}>Accept Transfer</AntButton>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="Stock Transfers"
        icon={ArrowRightLeft}
        description="Request and accept stock transfers between branches."
        actions={
          <AntButton 
            type="primary" 
            className="bg-indigo-600 hover:bg-indigo-700 h-10 px-4 rounded-lg shadow-sm font-bold"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Request Transfer
          </AntButton>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <DataTable 
          columns={columns} 
          dataSource={transfers} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </div>

      <FormModal
        title="Request Stock Transfer"
        icon={ArrowRightLeft}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); form.resetFields(); }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="mt-6"
        >
          <Form.Item 
            label="From Branch (Source)" 
            name="fromBranchId" 
            rules={[{ required: true, message: 'Source branch is required' }]}
          >
            <Select 
              showSearch
              placeholder="Select Source Branch"
              className="h-10"
              options={branches.map((b: Branch) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>

          {!activeBranchId && (
            <Form.Item 
              label="To Branch (Destination)" 
              name="toBranchId" 
              rules={[{ required: true, message: 'Destination branch is required' }]}
            >
              <Select 
                showSearch
                placeholder="Select Destination Branch"
                className="h-10"
                options={branches.map((b: Branch) => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
          )}

          <Form.Item 
            label="Ingredient to Transfer" 
            name="ingredientId" 
            rules={[{ required: true, message: 'Ingredient is required' }]}
          >
            <Select 
              showSearch
              placeholder="Select Ingredient"
              className="h-10"
              options={ingredients.map((i: Ingredient) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: 'Quantity is required' }]}
          >
            <InputNumber placeholder="Enter quantity" min={0.1} step={0.1} className="w-full h-10 pt-1" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-8">
            <AntButton onClick={() => setIsModalOpen(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-indigo-600" loading={submitting}>
              Request Transfer
            </AntButton>
          </div>
        </Form>
      </FormModal>
    </AnimatedPage>
  );
}
