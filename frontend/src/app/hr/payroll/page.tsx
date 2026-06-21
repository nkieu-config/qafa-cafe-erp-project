"use client"

import { useState, useEffect } from "react"
import { fetchAPI, generatePayrollRun, approvePayrollRun } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Table, Tag, Button as AntButton, Popconfirm, Typography } from "antd"
import { Users, FileText, CheckCircle, Receipt } from "lucide-react"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"

const { Text } = Typography;

export default function PayrollPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (activeBranchId && (role === 'SUPER_ADMIN' || role === 'MANAGER')) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [activeBranchId, role])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAPI(`/hr/payroll-runs?branchId=${activeBranchId}`)
      setPayrollRuns(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load payroll runs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!activeBranchId) return;
    setIsGenerating(true);
    const now = new Date();
    try {
      await generatePayrollRun(activeBranchId, now.getMonth() + 1, now.getFullYear());
      toast.success("Payroll run generated successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payroll");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approvePayrollRun(id);
      toast.success("Payroll approved!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve payroll");
    }
  };

  if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
    return <div className="text-center py-12 text-slate-500">Access Denied</div>
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading payroll...</div>
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
      render: (_: any, record: any) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Month {record.month} / {record.year}
        </span>
      ),
    },
    {
      title: 'Payslips Generated',
      key: 'payslips',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>{record.payslips?.length || 0} Employees</span>
        </div>
      ),
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      render: (_: any, record: any) => {
        const total = record.payslips?.reduce((sum: number, p: any) => sum + p.netPay, 0) || 0;
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
      render: (_: any, record: any) => {
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

  const expandedRowRender = (record: any) => {
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
          summary={(pageData: readonly any[]) => {
            let totalGross = 0;
            let totalSso = 0;
            let totalTax = 0;
            let totalNet = 0;

            pageData.forEach((row: any) => {
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
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="Payroll History"
        icon={Receipt}
        description="View and generate monthly payroll runs."
        actions={
          <AntButton 
            type="primary" 
            className="bg-violet-600 hover:bg-violet-700 h-10 px-4 rounded-lg shadow-sm font-bold"
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!activeBranchId}
          >
            Generate This Month's Payroll
          </AntButton>
        }
      />

      <DataTable 
        columns={columns} 
        dataSource={payrollRuns} 
        rowKey="id"
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />
    </AnimatedPage>
  )
}
