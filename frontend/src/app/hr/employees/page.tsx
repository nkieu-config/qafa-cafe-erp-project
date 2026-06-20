"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function EmployeesShiftsPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const [shifts, setShifts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeBranchId) {
      fetchData()
    }
  }, [activeBranchId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
        const data = await fetchAPI(`/hr/shifts/branch/${activeBranchId}`)
        setShifts(data || [])
      } else {
        const data = await fetchAPI('/hr/shifts/me')
        setShifts(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading shifts...</div>
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {(role === 'SUPER_ADMIN' || role === 'MANAGER') ? 'Branch Shifts & Directory' : 'My Shifts'}
        </h2>
        {(role === 'SUPER_ADMIN' || role === 'MANAGER') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </Button>
        )}
      </div>
      {shifts.length === 0 ? <p className="text-slate-500">No shifts scheduled.</p> : (
        <div className="grid gap-3">
          {shifts.map(shift => (
            <div key={shift.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {new Date(shift.startTime).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {new Date(shift.startTime).toLocaleTimeString()} - {new Date(shift.endTime).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                {(role === 'SUPER_ADMIN' || role === 'MANAGER') && (
                  <div className="text-sm font-medium mb-1">{shift.user?.name}</div>
                )}
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  shift.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  shift.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {shift.status || 'SCHEDULED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
