"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { seedAccounts } from "@/lib/api"
import { Table, Tag, Button, Spin, Popconfirm } from "antd"
import { FileText, TrendingUp, Play } from "lucide-react"
import { toast } from "sonner"
import { HubPageHeader } from "@/components/shared/hub-card"
import type { JournalEntry, Branch } from "@/types/api"

import { useAuth } from "@/context/AuthContext"
import { useBranches } from '@/hooks/domains/useGeneralQueries';
import { useLedger, useJournalEntries } from '@/hooks/domains/useAccountingQueries';

const LedgerTrendChart = dynamic(
  () => import("@/components/finance/LedgerTrendChart").then((m) => m.LedgerTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" />
      </div>
    ),
  },
);

export default function GeneralLedgerPage() {
  const { activeBranchId } = useAuth()
  const selectedBranch = activeBranchId ? String(activeBranchId) : "ALL"
  const [isSeeding, setIsSeeding] = useState(false)

  const { data: branches = [] } = useBranches()
  const { data: chartData = [], isLoading: isChartLoading } = useLedger(selectedBranch)
  const { data: entries = [], isLoading: isEntriesLoading, refetch: refetchEntries } = useJournalEntries(selectedBranch)
  const loading = isChartLoading || isEntriesLoading;

  const branchLabel = activeBranchId
    ? (branches as Branch[]).find((b) => b.id === activeBranchId)?.name ?? `Branch #${activeBranchId}`
    : "All Branches (HQ)"

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedAccounts();
      toast.success("Accounts seeded successfully");
      refetchEntries();
    } catch (err) {
      toast.error("Failed to seed accounts");
    } finally {
      setIsSeeding(false);
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
      render: (ref: string) => <Tag color="blue" className="font-mono">{ref || '-'}</Tag>,
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

  const expandedRowRender = (record: JournalEntry) => {
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
      <Table 
        columns={lineColumns} 
        dataSource={record.lines || []} 
        pagination={false} 
        rowKey="id" 
        size="small" 
        className="my-2 border border-slate-200 rounded-lg overflow-hidden"
        summary={(pageData: readonly { debit?: number; credit?: number }[]) => {
          let totalDebit = 0;
          let totalCredit = 0;

          pageData.forEach(({ debit, credit }) => {
            totalDebit += debit || 0;
            totalCredit += credit || 0;
          });

          return (
            <Table.Summary.Row className="bg-slate-50 font-black">
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
    <div className="space-y-6">
      <HubPageHeader
        title="Financial Dashboard & Ledger"
        icon={TrendingUp}
        description={`Profit & loss trends and journal entries for ${branchLabel}. Use the top bar branch selector to change scope.`}
        actions={
          entries.length === 0 && !loading ? (
            <Popconfirm
              title="Initialize Chart of Accounts?"
              description="This will seed standard accounting codes."
              onConfirm={handleSeed}
              okText="Seed"
              cancelText="Cancel"
            >
              <Button type="primary" loading={isSeeding} icon={<Play className="w-4 h-4" />}>
                Seed Accounts
              </Button>
            </Popconfirm>
          ) : undefined
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          Profit & Loss Trend
        </h2>
        <div className="h-[350px] w-full">
          {isChartLoading ? (
             <div className="flex h-full items-center justify-center">
               <Spin size="large" />
             </div>
          ) : (
            <LedgerTrendChart data={chartData} />
          )}
        </div>
      </div>

      <div className="pt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" /> General Ledger (Journal Entries)
        </h2>
        <Table 
          columns={columns} 
          dataSource={entries} 
          rowKey="id"
          loading={isEntriesLoading}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 20 }}
          className="border border-slate-200 rounded-xl overflow-hidden"
          locale={{ emptyText: "No journal entries found." }}
        />
      </div>

    </div>
  )
}
