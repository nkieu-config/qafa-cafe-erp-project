"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Table, Tag, Button as AntButton, Popconfirm, Typography } from "antd"
import { Users, FileText, CheckCircle, Receipt } from "lucide-react"
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { AccessDeniedState } from "@/components/shared/access-denied-state";
import { HubCard } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table"
import { PayrollRun, Payslip } from "@/types/api";
import { usePayrollRuns, useGeneratePayrollRun, useApprovePayrollRun } from '@/hooks/domains/useHrQueries';

const { Text } = Typography;

export default function PayrollPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const branchIdNum = activeBranchId ? Number(activeBranchId) : undefined;
  
  // Only fetch if activeBranchId is set and user is MANAGER or SUPER_ADMIN
  const { data: payrollRuns = [], isLoading } = usePayrollRuns(branchIdNum);
  
  const generatePayrollMutation = useGeneratePayrollRun();
  const approvePayrollMutation = useApprovePayrollRun();

  const handleGenerate = async () => {
    if (!branchIdNum) return;
    const now = new Date();
    try {
      await generatePayrollMutation.mutateAsync({ branchId: branchIdNum, month: now.getMonth() + 1, year: now.getFullYear() });
      toast.success("Payroll run generated successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to generate payroll"));
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approvePayrollMutation.mutateAsync(id);
      toast.success("Payroll run approved!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to approve payroll"));
    }
  };

  if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
    return <AccessDeniedState description="Manager or Super Admin access is required to view payroll." showBackLink={false} />;
  }

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to generate and manage payroll." />
    );
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PAID': return 'processing';
      case 'DRAFT': return 'default';
      default: return 'warning';
    }
  };

  const columns = [
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, record: PayrollRun & { payslips: Payslip[] }) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Month {record.month} / {record.year}
        </span>
      ),
    },
    {
      title: 'Payslips Generated',
      key: 'payslips',
      render: (_: unknown, record: PayrollRun & { payslips: Payslip[] }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>{record.payslips?.length || 0} Employees</span>
        </div>
      ),
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      render: (_: unknown, record: PayrollRun & { payslips: Payslip[] }) => {
        const total = record.payslips?.reduce((sum: number, p: Payslip) => sum + p.netPay, 0) || 0;
        return <span className="font-mono font-bold">฿{total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, record: PayrollRun & { payslips: Payslip[] }) => {
        if (record.status === 'DRAFT') {
          return (
            <Popconfirm title="Approve this payroll run?" onConfirm={() => handleApprove(record.id)}>
              <AntButton type="primary" size="small" className="bg-emerald-500 border-none" icon={<CheckCircle className="w-4 h-4" />}>
                Approve
              </AntButton>
            </Popconfirm>
          );
        }
        return null;
      }
    }
  ];

  const expandedRowRender = (record: PayrollRun & { payslips: Payslip[] }) => {
    const payslipColumns = [
      { title: 'Employee', dataIndex: ['user', 'name'], key: 'name', fixed: 'left' as const, width: 200, render: (name: string) => <span className="font-medium">{name}</span> },
      { title: 'Std Hrs', dataIndex: 'standardHours', key: 'std', width: 100, align: 'right' as const, render: (val: number) => <span className="font-mono text-slate-500">{val.toFixed(1)}</span> },
      { title: 'OT Hrs', dataIndex: 'otHours', key: 'ot', width: 100, align: 'right' as const, render: (val: number) => <span className="font-mono text-amber-600">{val.toFixed(1)}</span> },
      { title: 'Base Pay', dataIndex: 'basePay', key: 'basePay', width: 120, align: 'right' as const, render: (val: number) => <span className="font-mono">฿{val.toLocaleString()}</span> },
      { title: 'OT Pay', dataIndex: 'otPay', key: 'otPay', width: 120, align: 'right' as const, render: (val: number) => <span className="font-mono text-amber-600">฿{val.toLocaleString()}</span> },
      { title: 'Gross Pay', dataIndex: 'grossPay', key: 'grossPay', width: 120, align: 'right' as const, render: (val: number) => <span className="font-mono font-semibold">฿{val.toLocaleString()}</span> },
      { title: 'SSO (5%)', dataIndex: 'socialSecurity', key: 'sso', width: 120, align: 'right' as const, render: (val: number) => <span className="font-mono text-rose-500">-฿{val.toLocaleString()}</span> },
      { title: 'Tax (3%)', dataIndex: 'taxDeduction', key: 'tax', width: 120, align: 'right' as const, render: (val: number) => <span className="font-mono text-rose-500">-฿{val.toLocaleString()}</span> },
      { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', fixed: 'right' as const, width: 150, align: 'right' as const, render: (val: number) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">฿{val.toLocaleString(undefined, {minimumFractionDigits: 2})}</span> },
    ];

    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg m-2 border border-slate-200 dark:border-slate-800">
        <DataTable
          columns={payslipColumns}
          dataSource={record.payslips}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 1200 }}
          hideBorders
          summary={(pageData: readonly Payslip[]) => {
            let totalGross = 0;
            let totalSso = 0;
            let totalTax = 0;
            let totalNet = 0;

            pageData.forEach((row: Payslip) => {
              totalGross += row.grossPay || 0;
              totalSso += row.socialSecurity || 0;
              totalTax += row.taxDeduction || 0;
              totalNet += row.netPay || 0;
            });

            return (
              <Table.Summary.Row className="bg-slate-100 dark:bg-slate-800 font-bold">
                <Table.Summary.Cell index={0} colSpan={5}>Total</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right"><Text className="font-mono">฿{totalGross.toLocaleString()}</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right"><Text type="danger" className="font-mono">-฿{totalSso.toLocaleString()}</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right"><Text type="danger" className="font-mono">-฿{totalTax.toLocaleString()}</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right"><Text type="success" className="font-mono">฿{totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    );
  };

  return (
    <HubCard
      title="Payroll History"
      icon={Receipt}
      description="View and generate monthly payroll runs."
      actions={
        <AntButton 
          type="primary" 
          className="bg-violet-600 hover:bg-violet-700 h-10 px-4 rounded-lg shadow-sm font-bold"
          onClick={handleGenerate}
          disabled={generatePayrollMutation.isPending || (payrollRuns.length > 0 && payrollRuns[0].status === 'DRAFT')}
        >
          {generatePayrollMutation.isPending ? "Generating..." : "Generate This Month's Payroll"}
        </AntButton>
      }
    >
      <DataTable 
        loading={isLoading}
        columns={columns} 
        dataSource={payrollRuns} 
        rowKey="id"
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />
    </HubCard>
  )
}
