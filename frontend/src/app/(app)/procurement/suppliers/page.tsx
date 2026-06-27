"use client";

import { useState } from "react";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/domains/useProcurementQueries";
import { HubCard } from "@/components/shared/hub-card";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { Button as AntButton, Form, Input, Popconfirm } from "antd";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Supplier } from "@/types/api";

interface SupplierFormValues {
  name: string;
  contactEmail?: string;
  phone?: string;
}

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form] = Form.useForm<SupplierFormValues>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    form.setFieldsValue({
      name: supplier.name,
      contactEmail: supplier.contactEmail ?? undefined,
      phone: supplier.phone ?? undefined,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: SupplierFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...values });
        toast.success("Supplier updated");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Supplier created");
      }
      setOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  return (
    <>
      <HubCard
        title="Suppliers"
        icon={Building2}
        description="Manage vendor contacts for purchase orders."
        actions={
          <AntButton
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg"
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreate}
          >
            Add Supplier
          </AntButton>
        }
      >
      <DataTable
        loading={isLoading}
        rowKey="id"
        dataSource={suppliers}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Email", dataIndex: "contactEmail", key: "email", render: (v: string) => v || "-" },
          { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
          {
            title: "Actions",
            key: "actions",
            align: "right" as const,
            render: (_: unknown, row: Supplier) => (
              <div className="flex justify-end gap-2">
                <AntButton type="text" icon={<Pencil className="w-4 h-4" />} onClick={() => openEdit(row)} />
                <Popconfirm
                  title="Delete this supplier?"
                  onConfirm={async () => {
                    try {
                      await deleteMutation.mutateAsync(row.id);
                      toast.success("Supplier deleted");
                    } catch (err: unknown) {
                      if (err instanceof Error) toast.error(err.message);
                    }
                  }}
                >
                  <AntButton type="text" danger icon={<Trash2 className="w-4 h-4" />} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />
      </HubCard>

      <FormModal
        title={editing ? "Edit Supplier" : "Add Supplier"}
        icon={Building2}
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Supplier name" />
          </Form.Item>
          <Form.Item name="contactEmail" label="Email">
            <Input type="email" placeholder="sales@vendor.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="08x-xxx-xxxx" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <AntButton onClick={() => setOpen(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-blue-600" loading={createMutation.isPending || updateMutation.isPending}>
              Save
            </AntButton>
          </div>
        </Form>
      </FormModal>
    </>
  );
}
