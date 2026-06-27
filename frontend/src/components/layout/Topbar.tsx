"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bell, MapPin } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useBranches } from "@/hooks/domains/useGeneralQueries"
import {
  getStoredBranchSelection,
  resolveDefaultBranchId,
} from "@/lib/branch-storage"
import type { Branch } from "@/types/api"

export function Topbar() {
  const pathname = usePathname()
  const { user, activeBranchId, setActiveBranchId, isInitialized } = useAuth()
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const { data: branchesData = [] } = useBranches(isSuperAdmin)
  const branches = branchesData as Branch[]
  const hasAppliedBranchPref = useRef(false)

  const pathParts = pathname.split('/').filter(Boolean)
  const currentPage = pathParts.length > 0 
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
    : 'Dashboard'

  useEffect(() => {
    if (!isSuperAdmin || !isInitialized || branches.length === 0) return
    if (hasAppliedBranchPref.current) return
    hasAppliedBranchPref.current = true

    const selection = getStoredBranchSelection()
    if (selection === 'unset') {
      const defaultId = resolveDefaultBranchId(branches)
      if (defaultId != null) setActiveBranchId(defaultId)
      return
    }

    if (selection === null) {
      setActiveBranchId(null)
      return
    }

    if (branches.some((b) => b.id === selection)) {
      setActiveBranchId(selection)
    } else {
      const defaultId = resolveDefaultBranchId(branches)
      if (defaultId != null) setActiveBranchId(defaultId)
    }
  }, [isSuperAdmin, isInitialized, branches, setActiveBranchId])

  if (pathname === '/login') return null;

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 bg-transparent mb-4 z-20 relative">
      <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer">QafaCafe</span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold tracking-tight">{currentPage}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {isSuperAdmin && branches.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <select 
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer pr-4 max-w-[220px] truncate"
              value={activeBranchId ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setActiveBranchId(val ? Number(val) : null)
              }}
            >
              <option value="" className="dark:bg-slate-900">All Branches (HQ)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-slate-900">{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <button aria-label="Notifications" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <ThemeToggle />
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white dark:border-slate-800 shadow-sm"></div>
      </div>
    </header>
  )
}
