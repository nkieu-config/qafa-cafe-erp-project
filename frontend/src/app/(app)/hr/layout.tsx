"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedPage } from "@/components/animated-page"
import { AntdScope } from "@/components/providers/AntdScope"
import { useAuth } from "@/context/AuthContext"
import { Clock, CalendarDays, Users, Briefcase, Wallet } from "lucide-react"
import { useTheme } from 'next-themes'

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const role = user?.role;

  const tabs = [
    { name: "Employee Directory", path: "/hr/employees", icon: Users, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Shift Management", path: "/hr/shifts", icon: CalendarDays, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Attendance", path: "/hr/attendance", icon: Clock, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Leave Requests", path: "/hr/leave", icon: Briefcase, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    { name: "Payroll", path: "/hr/payroll", icon: Wallet, roles: ["SUPER_ADMIN", "MANAGER"] },
  ]

  return (
    <AntdScope>
      <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              Human Resources
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage staff, shifts, attendance and payroll.</p>
          </div>
        </div>

        {/* Tabs / Sub-navigation */}
        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto shrink-0">
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
        <div className="relative flex-1 min-h-0 w-full overflow-y-auto pb-10">
          {children}
        </div>
      </AnimatedPage>
    </AntdScope>
  )
}
