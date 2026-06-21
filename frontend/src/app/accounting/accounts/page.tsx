"use client"

import { useState, useMemo } from "react"
import { useAccounts } from "@/hooks/useQueries"
import { Tag, Typography } from "antd"
import { Landmark } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"

const { Text } = Typography;

export default function ChartOfAccountsPage() {
  const { data: accountsData = [], isLoading: loading } = useAccounts()

  const accountsTree = useMemo(() => {
    // Group by type to create Tree structure
    const grouped = accountsData.reduce((acc: any, account: any) => {
      const type = account.type;
      if (!acc[type]) {
        acc[type] = {
          id: `GROUP_${type}`,
          code: '',
          name: type.charAt(0) + type.slice(1).toLowerCase() + 's', // "Assets"
          type: type,
          isGroup: true,
          children: []
        };
      }
      acc[type].children.push(account);
      return acc;
    }, {});

    // Convert object to array and sort children by code
    const treeData = Object.values(grouped).map((group: any) => {
      group.children.sort((a: any, b: any) => a.code.localeCompare(b.code));
      return group;
    });

    return treeData;
  }, [accountsData]);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string, record: any) => 
        record.isGroup ? <span className="font-semibold text-slate-800 dark:text-slate-200">{record.type}</span> : <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => 
        record.isGroup ? <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{name}</span> : <span>{name}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string, record: any) => {
        if (record.isGroup) return null; // Hide badge on group row to keep it clean
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
      render: (isActive: boolean, record: any) => {
        if (record.isGroup) return null;
        return <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Chart of Accounts"
        icon={Landmark}
      />

      <DataTable 
        columns={columns} 
        dataSource={accountsTree} 
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows={true}
      />
    </div>
  )
}
