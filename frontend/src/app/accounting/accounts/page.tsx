"use client"

import { useEffect, useState } from "react"
import { getAccounts } from "@/lib/api"
import { Table, Tag, Spin } from "antd"
import { Landmark } from "lucide-react"
import { toast } from "sonner"

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const data = await getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <span className="font-mono font-medium">{code}</span>,
      sorter: (a: any, b: any) => a.code.localeCompare(b.code),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'default';
        if (type === 'ASSET') color = 'blue';
        else if (type === 'LIABILITY') color = 'volcano';
        else if (type === 'EQUITY') color = 'purple';
        else if (type === 'REVENUE') color = 'success';
        else if (type === 'EXPENSE') color = 'warning';
        
        return <Tag color={color}>{type}</Tag>
      },
      filters: [
        { text: 'Asset', value: 'ASSET' },
        { text: 'Liability', value: 'LIABILITY' },
        { text: 'Equity', value: 'EQUITY' },
        { text: 'Revenue', value: 'REVENUE' },
        { text: 'Expense', value: 'EXPENSE' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-500" />
          Chart of Accounts
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1">
        <Table 
          columns={columns} 
          dataSource={accounts} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          className="w-full overflow-x-auto [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:dark:bg-slate-800"
        />
      </div>
    </div>
  )
}
