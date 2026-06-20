"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedPage } from "@/components/animated-page"
import { useAuth } from "@/context/AuthContext"
import { BookOpen, Landmark } from "lucide-react"
import { ConfigProvider, theme } from 'antd';
import { useTheme } from 'next-themes';

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme();
  const role = user?.role;

  const tabs = [
    { name: "General Ledger", path: "/accounting/ledger", icon: BookOpen, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Chart of Accounts", path: "/accounting/accounts", icon: Landmark, roles: ["SUPER_ADMIN", "MANAGER"] },
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          fontFamily: 'inherit',
          colorPrimary: '#10b981', // Tailwind Emerald 500
          colorBgContainer: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff', // slate-900 / white
        },
      }}
    >
      <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance">Accounting</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">General Ledger and Chart of Accounts.</p>
          </div>
        </div>

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

        <div className="relative flex-1 min-h-0 w-full overflow-y-auto pb-10">
          {children}
        </div>
      </AnimatedPage>
    </ConfigProvider>
  )
}
