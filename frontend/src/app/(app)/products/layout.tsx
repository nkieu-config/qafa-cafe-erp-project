"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AnimatedPage } from "@/components/animated-page"
import { AntdScope } from "@/components/providers/AntdScope"
import { useAuth } from "@/context/AuthContext"
import { BarChart3, ClipboardList, Leaf, SlidersHorizontal } from "lucide-react"

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const role = user?.role;

  const tabs = [
    { name: "Menu Items", path: "/products", icon: ClipboardList, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Raw Ingredients", path: "/products/ingredients", icon: Leaf, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Modifiers", path: "/products/modifiers", icon: SlidersHorizontal, roles: ["SUPER_ADMIN", "MANAGER"] },
    { name: "Food Cost", path: "/products/costing", icon: BarChart3, roles: ["SUPER_ADMIN", "MANAGER"] },
  ]

  return (
    <AntdScope>
    <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" />
            Product & Menu Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage menu catalog, ingredients, POS modifiers, and food cost.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit overflow-x-auto shrink-0">
        {tabs.filter(t => t.roles.includes(role || '')).map(tab => {
          const isActive = tab.path === "/products" ? pathname === "/products" : pathname.startsWith(tab.path)
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
    </AntdScope>
  )
}
