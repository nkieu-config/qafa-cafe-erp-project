"use client"

import { AnimatedPage } from "@/components/animated-page"
import { useOrders } from '@/hooks/domains/useReportsQueries';
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { Order } from "@/types/api"

export default function CostingReportPage() {
  const { data: ordersData = [], isLoading } = useOrders()
  const orders = ordersData;

  const totalRevenue = orders.reduce((sum: number, o: Order) => sum + (o.netAmount || 0), 0)
  const totalCogs = orders.reduce((sum: number, o: Order) => sum + (o.totalCogs || 0), 0)
  const grossProfit = totalRevenue - totalCogs
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return (
    <AnimatedPage className="w-full space-y-6">
      <PageHeader 
        title="Costing & Profitability"
        icon={BarChart3}
        description="Track your revenue, COGS, and gross profit margins over time."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue"
          value={`฿${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard 
          title="Total COGS (Cost of Goods)"
          value={`฿${totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Activity}
          color="red"
        />
        <StatCard 
          title={`Gross Profit (Margin: ${margin.toFixed(1)}%)`}
          value={`฿${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="pt-4">
        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">Transaction History</h2>
        <DataTable 
          columns={[
            { title: "Order ID", dataIndex: "id", key: "id", render: (id: number) => <span className="font-medium text-slate-900 dark:text-slate-100">#{id}</span> },
            { title: "Date", dataIndex: "createdAt", key: "date", render: (date: string) => <span className="text-slate-600 dark:text-slate-400">{new Date(date).toLocaleString()}</span> },
            { title: "Revenue", dataIndex: "netAmount", key: "rev", align: "right", render: (val: number) => <span className="tabular-nums">฿{val.toFixed(2)}</span> },
            { title: "COGS", dataIndex: "totalCogs", key: "cogs", align: "right", render: (val: number) => <span className="text-red-500 tabular-nums">฿{val.toFixed(2)}</span> },
            { 
              title: "Profit", 
              key: "profit", 
              align: "right",
              render: (_, record: Order) => {
                const profit = record.netAmount - record.totalCogs;
                return <span className="text-blue-500 font-medium tabular-nums">฿{profit.toFixed(2)}</span>
              }
            },
          ]}
          dataSource={orders}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </AnimatedPage>
  )
}

