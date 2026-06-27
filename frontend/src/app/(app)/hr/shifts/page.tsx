"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useShifts } from '@/hooks/domains/useHrQueries';
import { CalendarDays, Plus, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HubPageHeader } from "@/components/shared/hub-card";
import { BranchEmptyState } from "@/components/shared/branch-empty-state";
import { DataTable } from "@/components/shared/data-table"
import { Shift, User } from "@/types/api"
import { Avatar, Tooltip } from "antd"

export default function EmployeesShiftsPage() {
  const router = useRouter()
  const { user, activeBranchId } = useAuth()
  const role = user?.role

  const { data: shiftsData, isLoading: loading } = useShifts(role, activeBranchId ?? undefined)
  const shifts = shiftsData || []



  // Group shifts by user for the Gantt view
  // For simplicity, we just filter today's shifts or show all in a generic 06:00 to 22:00 grid
  // We'll show the most recent or upcoming shifts (today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysShifts = shifts.filter((s: Shift & { user: User }) => {
    const d = new Date(s.startTime);
    return d >= todayStart && d <= todayEnd;
  });

  const usersWithShifts = Array.from(new Set(todaysShifts.map((s: Shift & { user: User }) => s.user?.name || 'Unknown'))) as string[];

  // Time blocks from 06:00 to 22:00 (16 hours)
  const HOURS_START = 6;
  const HOURS_END = 22;
  const hoursRange = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => i + HOURS_START);

  const calculateLeftPercent = (date: string | Date) => {
    const d = new Date(date);
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < HOURS_START) return 0;
    if (h > HOURS_END) return 100;
    return ((h - HOURS_START) / (HOURS_END - HOURS_START)) * 100;
  }

  const calculateWidthPercent = (start: string | Date, end: string | Date) => {
    const s = new Date(start);
    const e = new Date(end);
    let sh = s.getHours() + s.getMinutes() / 60;
    let eh = e.getHours() + e.getMinutes() / 60;
    
    if (sh < HOURS_START) sh = HOURS_START;
    if (eh > HOURS_END) eh = HOURS_END;
    
    let width = ((eh - sh) / (HOURS_END - HOURS_START)) * 100;
    return Math.max(0, width);
  }

  if (!activeBranchId) {
    return (
      <BranchEmptyState description="Select a branch in the top bar to view and manage shift schedules." />
    );
  }

  return (
    <div className="space-y-6">
      <HubPageHeader
        title={(role === 'SUPER_ADMIN' || role === 'MANAGER') ? 'Shift Schedule (Gantt)' : 'My Shifts'}
        icon={CalendarDays}
        description="Manage and view the time-block shift schedule for today."
        actions={
          (role === 'SUPER_ADMIN' || role === 'MANAGER') && (
            <div className="flex gap-2">
              {role === 'SUPER_ADMIN' && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                  onClick={() => router.push("/users")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
              )}
              <Button
                variant="outline"
                className="border-slate-200 dark:border-slate-700 bg-white font-bold shadow-sm"
                onClick={() => router.push("/hr/employees")}
              >
                <UserPlus className="w-4 h-4 mr-2" /> Directory
              </Button>
            </div>
          )
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-black text-slate-800 dark:text-slate-100 text-lg">Today's Timeline ({new Date().toLocaleDateString()})</h2>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : todaysShifts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">No shifts scheduled for today.</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header: Time Slots */}
              <div className="flex ml-40 border-b border-slate-200 dark:border-slate-800 pb-2 relative">
                {hoursRange.map(hour => (
                  <div key={hour} className="flex-1 text-xs font-black text-slate-400 text-center relative">
                    <span className="absolute -left-3 top-0 bg-white dark:bg-slate-900 px-1 z-10">{hour.toString().padStart(2, '0')}:00</span>
                    {hour === HOURS_END && <span className="absolute -right-3 top-0 bg-white dark:bg-slate-900 px-1 z-10">22:00</span>}
                  </div>
                ))}
              </div>

              {/* Body: Employees and Shifts */}
              <div className="relative mt-4 space-y-4">
                {/* Background Grid Lines */}
                <div className="absolute top-0 bottom-0 left-40 right-0 flex pointer-events-none">
                  {hoursRange.slice(0, -1).map(hour => (
                    <div key={hour} className="flex-1 border-l border-slate-100 dark:border-slate-800/50 border-dashed" />
                  ))}
                </div>

                {usersWithShifts.map((userName: string, idx: number) => {
                  const userShifts = todaysShifts.filter((s: Shift & { user: User }) => s.user?.name === userName);
                  return (
                    <div key={idx} className="flex items-center h-12 relative group">
                      {/* User Column */}
                      <div className="w-40 flex items-center gap-2 pr-4 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 group-hover:bg-slate-50 transition-colors">
                        <Avatar className="bg-indigo-500 font-bold shrink-0">{userName.charAt(0)}</Avatar>
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{userName}</span>
                      </div>

                      {/* Shifts Track */}
                      <div className="flex-1 h-full relative group-hover:bg-slate-50/50 transition-colors rounded-r-xl">
                        {userShifts.map((shift: Shift & { user: User }, i: number) => {
                          const left = calculateLeftPercent(shift.startTime);
                          const width = calculateWidthPercent(shift.startTime, shift.endTime);
                          
                          let colorClass = "bg-indigo-500 border-indigo-600";
                          if (shift.status === 'COMPLETED') colorClass = "bg-emerald-500 border-emerald-600";
                          if (shift.status === 'ABSENT') colorClass = "bg-rose-500 border-rose-600";

                          return (
                            <Tooltip 
                              key={i} 
                              title={`${new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${shift.status})`}
                            >
                              <div 
                                className={`absolute top-1 bottom-1 rounded-md border text-white text-[10px] font-black flex items-center justify-center overflow-hidden shadow-sm transition-all hover:scale-[1.02] cursor-pointer z-20 ${colorClass}`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                              >
                                {width > 10 ? shift.status : ''}
                              </div>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
