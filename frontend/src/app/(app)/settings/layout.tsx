"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedPage } from "@/components/animated-page"
import { Settings, History } from "lucide-react"
import { RoleGuard } from "@/components/RoleGuard"
import { AccessDeniedState } from "@/components/shared/access-denied-state"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: "General", path: "/settings", icon: Settings },
    { name: "Audit Trail", path: "/settings/audit", icon: History },
  ]

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN"]}
      fallback={
        <AccessDeniedState description="Super Admin access is required for system administration." />
      }
    >
      <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance flex items-center gap-2">
              <Settings className="w-6 h-6 text-slate-500" />
              System Administration
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Global settings and audit logs for the ERP.
            </p>
          </div>
        </div>

        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/settings"
                ? pathname === "/settings"
                : pathname.startsWith(tab.path)
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            )
          })}
        </div>

        <div className="relative flex-1 min-h-0 w-full overflow-y-auto pb-10">
          {children}
        </div>
      </AnimatedPage>
    </RoleGuard>
  )
}
