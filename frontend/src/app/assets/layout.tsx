"use client"

import { AnimatedPage } from "@/components/animated-page"
import { Wrench } from "lucide-react"

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return (
      <AnimatedPage className="max-w-[1600px] w-full mx-auto space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-balance flex items-center gap-2">
              <Wrench className="w-6 h-6 text-slate-500" />
              Asset Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage store equipment, coffee machines, and fixed assets.</p>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 w-full overflow-y-auto pb-10">
          {children}
        </div>
      </AnimatedPage>
  )
}
