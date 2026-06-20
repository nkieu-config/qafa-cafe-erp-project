"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedPage } from "@/components/animated-page"
import { useAuth } from "@/context/AuthContext"
import { Clock, CalendarDays, Users, Briefcase } from "lucide-react"

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = user?.role;

  const tabs = [
    { name: "Attendance", path: "/hr/attendance", icon: Clock, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Shifts & Directory", path: "/hr/employees", icon: CalendarDays, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Leave Requests", path: "/hr/leave", icon: Briefcase, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Payroll", path: "/hr/payroll", icon: Users, roles: ["SUPER_ADMIN", "MANAGER"] },
  ]

  return (
    <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance">Human Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage staff, shifts, attendance and payroll.</p>
        </div>
      </div>

      {/* Tabs / Sub-navigation */}
      <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.filter(t => t.roles.includes(role || '')).map(tab => {
          const isActive = pathname.startsWith(tab.path)
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </Link>
          )
        })}
      </div>

      {/* Content for the specific HR page */}
      <div className="glass-panel p-6 rounded-2xl relative">
        {children}
      </div>
    </AnimatedPage>
  )
}
