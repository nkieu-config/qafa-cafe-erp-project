"use client"

import { useEffect, useState } from "react"
import { getJournalEntries, getProfitLoss, getBranches, seedAccounts } from "@/lib/api"
import { Table, Tag, Button, Select } from "antd"
import { FileText, Database, TrendingUp, Filter, Building2, Download } from "lucide-react"
import { toast } from "sonner"
import { AnimatedPage } from "@/components/animated-page"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

import { useBranches, useLedger, useJournalEntries } from "@/hooks/useQueries"

export default function GeneralLedgerPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL")

  const { data: branches = [] } = useBranches()
  const { data: chartData = [], isLoading: isChartLoading } = useLedger(selectedBranch)
  const { data: entries = [], isLoading: isEntriesLoading, refetch: refetchEntries } = useJournalEntries(selectedBranch)
  const loading = isChartLoading || isEntriesLoading;

  const handleSeed = async () => {
    try {
      await seedAccounts()
      toast.success("Accounts seeded successfully")
      refetchEntries()
    } catch (err) {
      toast.error("Failed to seed accounts")
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span className="font-medium text-slate-600">{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref: string) => <Tag color="blue" className="font-mono">{ref}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span className="text-slate-700">{desc}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'POSTED' ? 'success' : 'default'} className="font-bold">{status}</Tag>
      ),
    },
  ]

  const expandedRowRender = (record: any) => {
    const lineColumns = [
      { title: 'Account Code', dataIndex: ['account', 'code'], key: 'code', render: (text: string) => <span className="font-mono font-bold text-slate-500">{text}</span> },
      { title: 'Account Name', dataIndex: ['account', 'name'], key: 'name', render: (text: string) => <span className="font-semibold text-slate-700">{text}</span> },
      { title: 'Description', dataIndex: 'description', key: 'desc', render: (text: string) => <span className="text-slate-500 italic">{text || '-'}</span> },
      { 
        title: 'Debit (THB)', 
        dataIndex: 'debit', 
        key: 'debit',
        render: (val: number) => val > 0 ? <span className="text-emerald-600 font-bold">{val.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> : '-',
        align: 'right' as const,
      },
      { 
        title: 'Credit (THB)', 
        dataIndex: 'credit', 
        key: 'credit',
        render: (val: number) => val > 0 ? <span className="text-rose-600 font-bold">{val.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> : '-',
        align: 'right' as const,
      },
    ]

    return (
      <DataTable 
        columns={lineColumns} 
        dataSource={record.lines} 
        pagination={false} 
        rowKey="id" 
        size="small" 
        hideBorders
        summary={(pageData: readonly any[]) => {
          let totalDebit = 0;
          let totalCredit = 0;

          pageData.forEach(({ debit, credit }) => {
            totalDebit += debit;
            totalCredit += credit;
          });

          return (
            <Table.Summary.Row className="bg-slate-100 dark:bg-slate-800 font-black">
              <Table.Summary.Cell index={0} colSpan={3}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <span className="text-emerald-600">{totalDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <span className="text-rose-600">{totalCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    )
  }

  return (
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="Financial Dashboard & Ledger"
        icon={TrendingUp}
        description="Track profit and loss trends and drill down into the general ledger."
        actions={
          <div className="flex flex-col gap-1 text-left min-w-[250px]">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Cost Center Filter
            </label>
            <Select
              allowClear
              placeholder="Select Branch"
              className="w-full"
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || "")}
              options={[
                ...branches.map((b: any) => ({ label: b.name, value: b.id.toString() }))
              ]}
            />
          </div>
        }
      />

      {/* Financial Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          Profit & Loss Trend
        </h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fill: '#64748b', fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(val) => `฿${val.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, undefined]}
              />
              <Legend wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                name="Revenue"
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                name="Expenses"
                dataKey="expense" 
                stroke="#f43f5e" 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="pt-2">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" /> General Ledger (Journal Entries)
        </h2>
        <DataTable 
          columns={columns} 
          dataSource={entries} 
          rowKey="id"
          loading={loading}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 20 }}
        />
      </div>

    </AnimatedPage>
  )
}
