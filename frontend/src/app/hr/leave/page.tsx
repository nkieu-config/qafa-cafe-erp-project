"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle, XCircle } from "lucide-react"

export default function LeaveRequestsPage() {
  const { activeBranchId, user } = useAuth()
  const role = user?.role;
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
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
        const data = await fetchAPI(`/hr/leave?branchId=${activeBranchId}`)
        setLeaveRequests(data || [])
      } else {
        const data = await fetchAPI('/hr/leave/me')
        setLeaveRequests(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const approveLeave = async (id: number, status: string) => {
    try {
      await fetchAPI(`/hr/leave/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      alert("Failed to update leave status");
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading leave requests...</div>
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Leave Requests</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>
      {leaveRequests.length === 0 ? <p className="text-slate-500">No leave requests.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {(role === 'SUPER_ADMIN' || role === 'MANAGER') && <th className="px-4 py-3 rounded-l-lg">Staff</th>}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
                {(role === 'SUPER_ADMIN' || role === 'MANAGER') && <th className="px-4 py-3 rounded-r-lg">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaveRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  {(role === 'SUPER_ADMIN' || role === 'MANAGER') && (
                    <td className="px-4 py-4 font-medium">{req.user?.name}</td>
                  )}
                  <td className="px-4 py-4">{req.type}</td>
                  <td className="px-4 py-4">
                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  {(role === 'SUPER_ADMIN' || role === 'MANAGER') && req.status === 'PENDING' && (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => approveLeave(req.id, 'APPROVED')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => approveLeave(req.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
