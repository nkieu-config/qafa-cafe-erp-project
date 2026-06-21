"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle, XCircle, CalendarOff } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { AnimatedPage } from "@/components/animated-page"

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
    <AnimatedPage className="space-y-6 w-full">
      <PageHeader 
        title="Leave Requests"
        icon={CalendarOff}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        }
      />
      <DataTable 
        columns={[
          ...(role === 'SUPER_ADMIN' || role === 'MANAGER' ? [{ title: "Staff", dataIndex: ["user", "name"], key: "staff" }] : []),
          { title: "Type", dataIndex: "type", key: "type" },
          { 
            title: "Dates", 
            key: "dates",
            render: (_, req: any) => `${new Date(req.startDate).toLocaleDateString()} - ${new Date(req.endDate).toLocaleDateString()}`
          },
          { 
            title: "Status", 
            dataIndex: "status", 
            key: "status",
            render: (status: string) => (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {status}
              </span>
            )
          },
          ...(role === 'SUPER_ADMIN' || role === 'MANAGER' ? [{
            title: "Actions",
            key: "actions",
            render: (_: any, req: any) => req.status === 'PENDING' ? (
              <div className="flex gap-2">
                <button onClick={() => approveLeave(req.id, 'APPROVED')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => approveLeave(req.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : null
          }] : [])
        ]}
        dataSource={leaveRequests}
        rowKey="id"
        loading={isLoading}
      />
    </AnimatedPage>
  )
}
