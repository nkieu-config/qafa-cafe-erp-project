"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function PayrollPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    } finally {
      setIsLoading(false)
    }
  }

  if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
    return <div className="text-center py-12 text-slate-500">Access Denied</div>
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading payroll...</div>
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payroll Runs</h2>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
          Generate Payroll
        </Button>
      </div>
      {payrollRuns.length === 0 ? <p className="text-slate-500">No payroll runs found.</p> : (
        <div className="grid gap-4">
          {payrollRuns.map(run => (
            <div key={run.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Month {run.month} / {run.year}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {run.payslips?.length} Payslips generated
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  run.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  run.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {run.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
