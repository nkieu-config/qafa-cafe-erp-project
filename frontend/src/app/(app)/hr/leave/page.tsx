"use client"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle, XCircle, CalendarOff } from "lucide-react"
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table";
import { LeaveRequest } from "@/types/api";
import { useLeaveRequests, useUpdateLeaveStatus, useCreateLeave } from '@/hooks/domains/useHrQueries';
import { getErrorMessage } from "@/lib/errors"
import { toast } from "sonner"
import { useState } from "react"
import { FormModal } from "@/components/shared/form-modal"
import { Form, Select, DatePicker, Input, Button as AntButton } from "antd"

export default function LeaveRequestsPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const isManagerOrAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER';
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;

  const { data: leaveRequests = [], isLoading } = useLeaveRequests(branchIdNum, isManagerOrAdmin);
  const updateLeaveStatusMutation = useUpdateLeaveStatus();
  const createLeaveMutation = useCreateLeave();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const approveLeave = async (id: number, status: string) => {
    try {
      await updateLeaveStatusMutation.mutateAsync({ id, status });
      toast.success(`Leave status updated to ${status}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update leave status"));
    }
  }

  const handleCreateLeave = async (values: { type: string; dates: [Date, Date]; reason?: string }) => {
    try {
      await createLeaveMutation.mutateAsync({
        type: values.type,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
        reason: values.reason
      });
      toast.success("Leave requested successfully");
      setIsModalOpen(false);
      form.resetFields();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to request leave"));
    }
  }



  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view and manage leave requests." />
    );
  }

  return (
    <>
      <HubCard
        title="Leave Requests"
        icon={CalendarOff}
        actions={
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        }
      >
      <DataTable 
        columns={[
          ...(role === 'SUPER_ADMIN' || role === 'MANAGER' ? [{ title: "Staff", dataIndex: ["user", "name"], key: "staff" }] : []),
          { title: "Type", dataIndex: "type", key: "type" },
          { 
            title: "Dates", 
            key: "dates",
            render: (_: unknown, req: LeaveRequest) => `${new Date(req.startDate).toLocaleDateString()} - ${new Date(req.endDate).toLocaleDateString()}`
          },
          { 
            title: "Status", 
            dataIndex: "status", 
            key: "status",
            render: (status: string) => (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {status}
              </span>
            )
          },
          ...(role === 'SUPER_ADMIN' || role === 'MANAGER' ? [{
            title: "Actions",
            key: "actions",
            render: (_: unknown, req: LeaveRequest) => req.status === 'PENDING' ? (
              <div className="flex gap-2">
                <button onClick={() => approveLeave(req.id, 'APPROVED')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => approveLeave(req.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : null
          }] : [])
        ]}
        dataSource={leaveRequests}
        rowKey="id"
        loading={isLoading}
      />
      </HubCard>

      <FormModal
        title="Request Leave"
        icon={CalendarOff}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); form.resetFields(); }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLeave}
          className="mt-4"
        >
          <Form.Item 
            label="Leave Type" 
            name="type" 
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select 
              options={[
                { value: 'SICK', label: 'Sick Leave' },
                { value: 'ANNUAL', label: 'Annual Leave' },
                { value: 'UNPAID', label: 'Unpaid Leave' }
              ]} 
              className="h-10"
            />
          </Form.Item>

          <Form.Item 
            label="Dates" 
            name="dates" 
            rules={[{ required: true, message: 'Please select dates' }]}
          >
            <DatePicker.RangePicker className="w-full h-10" />
          </Form.Item>

          <Form.Item 
            label="Reason" 
            name="reason" 
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <Input.TextArea rows={4} placeholder="Briefly explain your reason..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-8">
            <AntButton onClick={() => setIsModalOpen(false)}>Cancel</AntButton>
            <AntButton type="primary" htmlType="submit" className="bg-emerald-600" loading={createLeaveMutation.isPending}>
              Submit Request
            </AntButton>
          </div>
        </Form>
      </FormModal>
    </>
  )
}
