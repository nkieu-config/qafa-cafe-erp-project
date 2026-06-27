"use client"

import { useState, useMemo } from "react"
import { useAccounts } from '@/hooks/domains/useAccountingQueries';
import { Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Landmark } from "lucide-react"
import { HubCard } from "@/components/shared/hub-card"
import { DataTable } from "@/components/shared/data-table"
import { groupAccountsByType } from "@/lib/accounts"
import type { AccountTableRow } from "@/types/api"

const { Text } = Typography;

export default function ChartOfAccountsPage() {
  const { data: accountsData = [], isLoading: loading } = useAccounts()

  const accountsTree = useMemo(
    () => groupAccountsByType(accountsData),
    [accountsData],
  );

  const columns: ColumnsType<AccountTableRow> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string, record) => 
        'isGroup' in record && record.isGroup
          ? <span className="font-semibold text-slate-800 dark:text-slate-200">{record.type}</span>
          : <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => 
        'isGroup' in record && record.isGroup
          ? <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{name}</span>
          : <span>{name}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string, record) => {
        if ('isGroup' in record && record.isGroup) return null;
        let color = 'default';
        if (type === 'ASSET') color = 'blue';
        else if (type === 'LIABILITY') color = 'volcano';
        else if (type === 'EQUITY') color = 'purple';
        else if (type === 'REVENUE') color = 'success';
        else if (type === 'EXPENSE') color = 'warning';
        
        return <Tag color={color}>{type}</Tag>
      },
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
      width: 100,
      render: (isActive: boolean, record) => {
        if ('isGroup' in record && record.isGroup) return null;
        return <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      },
    },
  ]

  return (
    <HubCard title="Chart of Accounts" icon={Landmark}>
      <DataTable 
        columns={columns} 
        dataSource={accountsTree} 
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows={true}
      />
    </HubCard>
  )
}
