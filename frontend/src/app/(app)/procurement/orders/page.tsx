"use client";

import { useMemo, useState } from "react";
import { usePurchaseOrders, useSuppliers, useCreatePurchaseOrder, useSubmitPurchaseOrder, useApprovePurchaseOrder, useRejectPurchaseOrder, useReceivePurchaseOrder } from '@/hooks/domains/useProcurementQueries';
import { useIngredients } from '@/hooks/domains/useProductionQueries';
import { useAuth } from "@/context/AuthContext";
import { Table, Tag, Button as AntButton, Form, Select, InputNumber, Space, Steps, Popconfirm } from "antd";
import { FormModal } from "@/components/shared/form-modal";
import { Plus, CheckCircle2, XCircle, CheckSquare, Trash2, Truck, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { PurchaseOrder, Supplier, Ingredient, PurchaseOrderItem } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface CreatePOFormValues {
  supplierId: number;
  items: { ingredientId: number; quantity: number; unitPrice?: number }[];
}

export default function ProcurementPage() {
  const { user, activeBranchId } = useAuth();
  const { data: posData, isLoading: loadingPos } = usePurchaseOrders();
  const { data: suppliersData, isLoading: loadingSup } = useSuppliers();
  const { data: ingredientsData, isLoading: loadingIng } = useIngredients();

  const suppliers = suppliersData || [];
  const ingredients = ingredientsData || [];
  
  let pos = posData || [];
  if (activeBranchId) {
    pos = pos.filter((po: PurchaseOrder) => po.branchId === activeBranchId);
  }

  const loading = loadingPos || loadingSup || loadingIng;

  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();
  const createMutation = useCreatePurchaseOrder();
  const submitMutation = useSubmitPurchaseOrder();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const [expiryByIngredient, setExpiryByIngredient] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Removed manual loadData with useEffect

  const handleApprove = async (poId: number) => {
    try {
      await approveMutation.mutateAsync(poId);
      toast.success("Purchase Order approved successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to approve PO");
    }
  };

  const handleReject = async (poId: number) => {
    try {
      await rejectMutation.mutateAsync(poId);
      toast.success("Purchase Order rejected.");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to reject PO");
    }
  };

  const openReceive = (po: PurchaseOrder) => {
    setReceivePo(po);
    const defaults: Record<number, string> = {};
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const iso = defaultDate.toISOString().slice(0, 10);
    for (const item of po.items ?? []) {
      defaults[item.ingredientId] = iso;
    }
    setExpiryByIngredient(defaults);
  };

  const handleReceive = async () => {
    if (!receivePo) return;
    try {
      const items = (receivePo.items ?? []).map((item) => ({
        ingredientId: item.ingredientId,
        expiryDate: expiryByIngredient[item.ingredientId] || undefined,
      }));
      await receiveMutation.mutateAsync({ id: receivePo.id, items });
      toast.success("Purchase Order received! Inventory updated.");
      setReceivePo(null);
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to receive PO");
    }
  };

  const handleCreateSubmit = async (values: CreatePOFormValues) => {
    if (!activeBranchId) {
      toast.error("Please select a branch first");
      return;
    }
    if (!values.items || values.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        branchId: activeBranchId,
        supplierId: values.supplierId,
        items: values.items.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          unitPrice: i.unitPrice ?? 0,
        })),
      });
      toast.success("Purchase Order created successfully");
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message || "Failed to create PO");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "blue";
      case "RECEIVED": return "success";
      case "PENDING": return "warning";
      case "DRAFT": return "default";
      default: return "default";
    }
  };

  const getStepCurrent = (status: string) => {
    switch (status) {
      case "DRAFT": return 0;
      case "PENDING": return 1;
      case "APPROVED": return 2;
      case "RECEIVED": return 3;
      default: return 0;
    }
  };

  const canApprove = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const sortedPos = useMemo(() => {
    return [...pos].sort((a, b) => {
      const aDraftAuto = a.status === 'DRAFT' && a.isAutoGenerated ? 1 : 0;
      const bDraftAuto = b.status === 'DRAFT' && b.isAutoGenerated ? 1 : 0;
      if (aDraftAuto !== bDraftAuto) return bDraftAuto - aDraftAuto;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [pos]);

  const draftAutoPos = useMemo(
    () => sortedPos.filter((po) => po.status === 'DRAFT' && po.isAutoGenerated),
    [sortedPos],
  );

  const handleSubmit = async (poId: number) => {
    try {
      await submitMutation.mutateAsync(poId);
      toast.success("Purchase order submitted for approval");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to submit PO");
    }
  };

  const columns = [
    {
      title: 'PO Number',
      key: 'poNumber',
      render: (_: unknown, record: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{record.poNumber}</span>
          {record.isAutoGenerated && <Tag color="blue" className="text-[10px]">AUTO</Tag>}
        </div>
      ),
    },
    {
      title: 'Branch',
      dataIndex: ['branch', 'name'],
      key: 'branch',
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'dd MMM yyyy HH:mm'),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: PurchaseOrder) => (
        <Tag color={getStatusColor(record.status)} className="px-2 py-0.5 rounded-md font-medium tracking-wide">
          {record.status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, po: PurchaseOrder) => (
        <div className="flex justify-end gap-2">
          {po.status === 'DRAFT' && (po.items?.length ?? 0) > 0 && (
            <AntButton
              type="primary"
              className="bg-indigo-600 hover:bg-indigo-700 border-none"
              size="small"
              icon={<Send className="w-3 h-3" />}
              loading={submitMutation.isPending}
              onClick={() => void handleSubmit(po.id)}
            >
              Submit
            </AntButton>
          )}
          {po.status === 'PENDING' && canApprove && (
            <>
              <Popconfirm title="Approve this PO?" onConfirm={() => handleApprove(po.id)}>
                <AntButton type="primary" className="bg-blue-600 hover:bg-blue-700 border-none" size="small" icon={<CheckSquare className="w-3 h-3" />}>Approve</AntButton>
              </Popconfirm>
              <Popconfirm title="Reject this PO?" onConfirm={() => handleReject(po.id)}>
                <AntButton danger size="small" icon={<XCircle className="w-3 h-3" />}>Reject</AntButton>
              </Popconfirm>
            </>
          )}
          
          {po.status === 'APPROVED' && (
            <AntButton
              type="primary"
              className="bg-emerald-500 hover:bg-emerald-600 border-none"
              size="small"
              icon={<CheckCircle2 className="w-3 h-3" />}
              onClick={() => openReceive(po)}
            >
              Receive
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  const expandedRowRender = (record: PurchaseOrder) => {
    const itemColumns = [
      { title: 'Ingredient', dataIndex: ['ingredient', 'name'], key: 'name' },
      { title: 'Quantity Req.', dataIndex: 'quantityRequested', key: 'qty', render: (val: number, rec: PurchaseOrderItem) => `${val} ${rec.ingredient?.unit ?? ''}` },
      { title: 'Unit Price', dataIndex: 'unitPrice', key: 'price', render: (val: number) => `฿${Number(val).toFixed(2)}` },
      { title: 'Total', key: 'total', render: (_: unknown, rec: PurchaseOrderItem) => `฿${(rec.quantityRequested * rec.unitPrice).toFixed(2)}` },
    ];

    const stepItems = [
      { title: "Draft", description: "Prepared" },
      { title: "Pending", description: "Approval" },
      { title: "Approved", description: "Waiting Delivery" },
      { title: "Received", description: "In Stock" }
    ];

    return (
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg m-2 border border-slate-100 dark:border-slate-800">
        <div className="mb-6 px-10">
          <Steps 
            current={getStepCurrent(record.status)} 
            size="small"
            status={
              record.status === 'DRAFT' &&
              !record.isAutoGenerated &&
              (record.items?.length ?? 0) === 0
                ? 'error'
                : 'process'
            }
            items={stepItems}
          />
        </div>
        <DataTable 
          columns={itemColumns} 
          dataSource={record.items ?? []} 
          rowKey="id" 
          pagination={false} 
          size="small" 
          hideBorders
        />
      </div>
    );
  };

  return (
    <>
      {!activeBranchId ? (
        <BranchEmptyState description="Select a branch in the top bar to view and manage purchase orders." />
      ) : (
      <HubCard
        title="Purchase Orders"
        icon={Truck}
        description="Manage procurement orders and track deliveries."
        actions={
          <AntButton 
            type="primary" 
            className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg shadow-sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create PO
          </AntButton>
        }
      >

      {draftAutoPos.length > 0 && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-indigo-900 dark:text-indigo-100">
                {draftAutoPos.length} auto-reorder draft{draftAutoPos.length > 1 ? 's' : ''} ready
              </p>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80">
                Created when stock fell below minimum. Review and submit for manager approval.
              </p>
            </div>
          </div>
        </div>
      )}

      <DataTable 
        columns={columns} 
        dataSource={sortedPos} 
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />
      </HubCard>
      )}

      {/* Create PO Modal */}
      <FormModal
        title="Create Purchase Order"
        icon={Truck}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); form.resetFields(); }}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="mt-6"
        >
          <Form.Item 
            label="Select Supplier" 
            name="supplierId" 
            rules={[{ required: true, message: 'Supplier is required' }]}
          >
            <Select 
              showSearch
              placeholder="Search and select supplier"
              optionFilterProp="children"
              className="h-10"
              options={suppliers.map((s: Supplier) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Order Items</h3>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-4 items-start mb-4">
                      <Form.Item
                        {...restField}
                        name={[name, 'ingredientId']}
                        rules={[{ required: true, message: 'Missing ingredient' }]}
                        className="mb-0 flex-1"
                      >
                        <Select 
                          showSearch
                          placeholder="Ingredient"
                          options={ingredients.map((i: Ingredient) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                          onChange={(val) => {
                            // Auto-fill price if available
                            const ing = ingredients.find((i: Ingredient) => i.id === val);
                            if (ing && ing.costPerUnit != null) {
                              const currentItems = form.getFieldValue('items');
                              currentItems[name].unitPrice = Number(ing.costPerUnit);
                              form.setFieldsValue({ items: currentItems });
                            }
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Missing Qty' }]}
                        className="mb-0 w-32"
                      >
                        <InputNumber placeholder="Qty" min={0.1} step={0.1} className="w-full" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'unitPrice']}
                        rules={[{ required: true, message: 'Missing Price' }]}
                        className="mb-0 w-32"
                      >
                        <InputNumber placeholder="Price/Unit" min={0} step={0.01} className="w-full" />
                      </Form.Item>

                      <AntButton type="text" danger onClick={() => remove(name)} icon={<Trash2 className="w-4 h-4"/>} />
                    </div>
                  ))}
                  <Form.Item className="mb-0 mt-4">
                    <AntButton type="dashed" onClick={() => add()} block icon={<Plus className="w-4 h-4" />}>
                      Add Item
                    </AntButton>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <div className="flex justify-end gap-2">
            <AntButton onClick={() => setIsModalOpen(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-blue-600" loading={submitting}>
              Submit PO
            </AntButton>
          </div>
        </Form>
      </FormModal>

      <FormModal
        title={`Receive ${receivePo?.poNumber ?? 'PO'}`}
        icon={CheckCircle2}
        isOpen={!!receivePo}
        onClose={() => setReceivePo(null)}
        width={560}
      >
        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-500">Set expiry dates for incoming batches (optional per line).</p>
          {(receivePo?.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{item.ingredient?.name}</div>
                <div className="text-xs text-slate-500">{item.quantityRequested} {item.ingredient?.unit}</div>
              </div>
              <div className="w-44">
                <Label className="text-xs">Expiry date</Label>
                <Input
                  type="date"
                  value={expiryByIngredient[item.ingredientId] ?? ''}
                  onChange={(e) =>
                    setExpiryByIngredient((prev) => ({
                      ...prev,
                      [item.ingredientId]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <AntButton onClick={() => setReceivePo(null)}>Cancel</AntButton>
            <AntButton type="primary" className="bg-emerald-600" loading={receiveMutation.isPending} onClick={handleReceive}>
              Confirm Receive
            </AntButton>
          </div>
        </div>
      </FormModal>
    </>
  );
}
