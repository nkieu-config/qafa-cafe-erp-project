"use client"

import { useState, useEffect } from "react"
import { fetchAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function AttendancePage() {
  const { activeBranchId } = useAuth()
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeBranchId) {
      fetchData()
    }
  }, [activeBranchId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAPI('/hr/attendance/me')
      setAttendance(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500">Loading attendance...</div>
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">My Attendance Records</h2>
      {attendance.length === 0 ? <p className="text-slate-500">No records found.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Date</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3 rounded-r-lg">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">{new Date(record.clockIn).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-emerald-600 font-medium">{new Date(record.clockIn).toLocaleTimeString()}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                    {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'Active'}
                  </td>
                  <td className="px-4 py-4 font-bold">{record.totalHours ? record.totalHours.toFixed(2) + ' hrs' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
