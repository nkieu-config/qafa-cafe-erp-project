"use client"

import { useState } from "react"
import { AnimatedPage } from "@/components/animated-page"
import { useBranchDetails, useWasteLogs, useReportWaste } from "@/hooks/useQueries"
import { Button } from "@/components/ui/button"
import { Trash2, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"

import { BranchInventory, WasteLog } from "@/types"

export default function WasteLogPage() {
  const { activeBranchId } = useAuth()

  const { data: branchDetails, isLoading: loadingBranch } = useBranchDetails(activeBranchId ?? undefined)
  const inventory = branchDetails?.inventories || []

  const { data: logsData, isLoading: loadingLogs } = useWasteLogs(activeBranchId ?? undefined)
  const logs = logsData || []

  const isLoading = loadingBranch || loadingLogs
  const reportWasteMutation = useReportWaste()

  const [form, setForm] = useState({
    ingredientId: "",
    quantity: "",
    reason: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ingredientId || !form.quantity || !form.reason || !activeBranchId) return
    try {
      await reportWasteMutation.mutateAsync({
        branchId: activeBranchId,
        data: {
          ingredientId: parseInt(form.ingredientId),
          quantity: parseFloat(form.quantity),
          reason: form.reason
        }
      })
      setForm({ ingredientId: "", quantity: "", reason: "" })
    } catch (error) {
      alert("Failed to record waste")
    }
  }

  return (
    <AnimatedPage className="w-full space-y-6">
      <PageHeader 
        title="Waste Management"
        icon={Trash2}
        description="Record and track inventory wastage."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Form */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 h-fit">
          <div className="flex items-center gap-3 text-red-500">
            <Trash2 className="w-5 h-5" />
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Record Waste</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Ingredient</label>
              <select 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={form.ingredientId}
                onChange={e => setForm({...form, ingredientId: e.target.value})}
                required
              >
                <option value="">Select Ingredient...</option>
                {inventory.map((inv: any) => (
                  <option key={inv.ingredientId} value={inv.ingredientId}>
                    {inv.ingredient.name} (Stock: {inv.stock} {inv.ingredient.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Quantity Wasted</label>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})}
                required
                placeholder="e.g. 10.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Reason</label>
              <input 
                type="text"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
                required
                placeholder="e.g. Expired, Spilled"
              />
            </div>
            <Button type="submit" className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-500/20">
              Submit Waste Log
            </Button>
          </form>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2 pt-2">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">Recent Waste Logs</h2>
          <DataTable 
            columns={[
              { title: "Date", dataIndex: "createdAt", key: "date", render: (val: string) => <span className="tabular-nums text-slate-600 dark:text-slate-400">{new Date(val).toLocaleString()}</span> },
              { title: "Ingredient", dataIndex: "ingredient", key: "ing", render: (ing: any) => <span className="font-medium">{ing.name}</span> },
              { title: "Quantity", key: "qty", render: (_, record: any) => <span className="text-red-500 font-medium tabular-nums">-{record.quantity} {record.ingredient.unit}</span> },
              { title: "Reason", dataIndex: "reason", key: "reason" },
              { title: "Recorded By", dataIndex: "recordedBy", key: "recordedBy", render: (user: any) => user.name }
            ]}
            dataSource={logs}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>
    </AnimatedPage>
  )
}
