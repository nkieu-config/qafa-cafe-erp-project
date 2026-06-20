"use client"

import { useEffect, useState } from "react"
import { getJournalEntries, seedAccounts } from "@/lib/api"
import { Table, Tag, Button, Spin } from "antd"
import { FileText, Database } from "lucide-react"
import { toast } from "sonner"

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const data = await getJournalEntries()
      setEntries(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load journal entries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSeed = async () => {
    try {
      await seedAccounts()
      toast.success("Accounts seeded successfully")
      fetchEntries()
    } catch (err) {
      toast.error("Failed to seed accounts")
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref: string) => <Tag color="blue">{ref}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'POSTED' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
  ]

  const expandedRowRender = (record: any) => {
    const lineColumns = [
      { title: 'Account Code', dataIndex: ['account', 'code'], key: 'code' },
      { title: 'Account Name', dataIndex: ['account', 'name'], key: 'name' },
      { title: 'Description', dataIndex: 'description', key: 'desc' },
      { 
        title: 'Debit (THB)', 
        dataIndex: 'debit', 
        key: 'debit',
        render: (val: number) => val > 0 ? <span className="text-emerald-600 font-medium">{val.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> : '-',
        align: 'right' as const,
      },
      { 
        title: 'Credit (THB)', 
        dataIndex: 'credit', 
        key: 'credit',
        render: (val: number) => val > 0 ? <span className="text-rose-600 font-medium">{val.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> : '-',
        align: 'right' as const,
      },
    ]

    return <Table columns={lineColumns} dataSource={record.lines} pagination={false} rowKey="id" size="small" className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          General Ledger
        </h2>
        <Button icon={<Database size={16} />} onClick={handleSeed}>Seed Default Accounts</Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1">
        <Table 
          columns={columns} 
          dataSource={entries} 
          rowKey="id"
          expandable={{ expandedRowRender }}
          loading={loading}
          pagination={{ pageSize: 15 }}
          className="w-full overflow-x-auto [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:dark:bg-slate-800"
        />
      </div>
    </div>
  )
}
