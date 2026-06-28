import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calculator, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSubmitSettlement } from '@/hooks/domains/useFinanceQueries'
import type { SettlementExpected } from '@/types/api'
import { getErrorMessage } from '@/lib/errors'
import {
  posFormPanelClassName,
  posNativeInputClassName,
  posPrimaryActionClassName,
  posSettlementHighlightClassName,
  posSettlementIconClassName,
  posSettlementSummaryClassName,
  text,
} from '@/lib/theme'
import { cn } from '@/lib/utils'

type SettlementFormProps = {
  branchIdNum: number | undefined
  expected: SettlementExpected | undefined
  expectedLoading?: boolean
  expectedUnavailable?: boolean
  canViewFinance?: boolean
}

function SettlementSummarySkeleton() {
  return (
    <div className={posSettlementSummaryClassName()} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 rounded-md bg-[var(--surface-inset)] animate-pulse motion-reduce:animate-none",
            index === 2 && "h-5 mt-2",
          )}
        />
      ))}
    </div>
  )
}

export function SettlementForm({
  branchIdNum,
  expected,
  expectedLoading = false,
  expectedUnavailable = false,
  canViewFinance = false,
}: SettlementFormProps) {
  const router = useRouter()
  const [actualCash, setActualCash] = useState<string>("")
  const [actualCreditCard, setActualCreditCard] = useState<string>("")
  const [actualQR, setActualQR] = useState<string>("")

  const submitSettlementMutation = useSubmitSettlement();
  const formDisabled = expectedUnavailable || submitSettlementMutation.isPending

  const handleSettlement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actualCash || !branchIdNum || expectedUnavailable) return
    try {
      await submitSettlementMutation.mutateAsync({
        branchId: branchIdNum,
        actualCash: parseFloat(actualCash),
        actualCreditCard: parseFloat(actualCreditCard || "0"),
        actualQR: parseFloat(actualQR || "0")
      });
      toast.success("Settlement submitted for HQ approval.", canViewFinance ? {
        action: {
          label: "Finance Overview",
          onClick: () => router.push("/finance/overview"),
        },
      } : undefined)
      setActualCash("")
      setActualCreditCard("")
      setActualQR("")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to submit settlement"))
    }
  }

  return (
    <div className={posFormPanelClassName()}>
      <div className="flex items-center gap-3">
        <Calculator className={`w-5 h-5 ${posSettlementIconClassName()}`} />
        <h2 className={`font-semibold text-lg ${text.primary}`}>Submit Shift Settlement</h2>
      </div>
      
      {expectedLoading ? (
        <SettlementSummarySkeleton />
      ) : (
        <div className={posSettlementSummaryClassName()}>
          <div className={`flex justify-between text-sm ${text.muted}`}>
            <span>Total Sales (Cash):</span>
            <span className="font-medium tabular-nums">฿{expected?.sales?.toLocaleString() || 0}</span>
          </div>
          <div className={`flex justify-between text-sm ${text.muted}`}>
            <span>Petty Cash Expenses:</span>
            <span className="font-medium tabular-nums text-[var(--status-danger-fg)]">-฿{expected?.expenses?.toLocaleString() || 0}</span>
          </div>
          <div className={`pt-2 mt-2 border-t border-[var(--pos-panel-border)] flex justify-between font-semibold`}>
            <span className={text.primary}>Expected Cash in Drawer:</span>
            <span className={posSettlementHighlightClassName()}>฿{expected?.expectedCash?.toLocaleString() || 0}</span>
          </div>
          <div className={`flex justify-between text-sm ${text.muted} pt-2`}>
            <span>Expected Credit Card:</span>
            <span className="font-medium tabular-nums">฿{expected?.expectedCreditCard?.toLocaleString() || 0}</span>
          </div>
          <div className={`flex justify-between text-sm ${text.muted}`}>
            <span>Expected QR Promtpay:</span>
            <span className="font-medium tabular-nums">฿{expected?.expectedQR?.toLocaleString() || 0}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSettlement} className="flex flex-col gap-4">
        <div>
          <label className={`text-sm font-medium mb-1.5 block ${text.secondary}`}>Actual Cash Counted *</label>
          <input 
            type="number"
            step="0.01"
            className={posNativeInputClassName("py-3 text-lg font-medium")}
            value={actualCash}
            onChange={e => setActualCash(e.target.value)}
            required
            disabled={formDisabled}
            placeholder="e.g. 5500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`text-sm font-medium mb-1.5 block ${text.secondary}`}>Actual Card Sales</label>
            <input 
              type="number"
              step="0.01"
              className={posNativeInputClassName("py-2")}
              value={actualCreditCard}
              onChange={e => setActualCreditCard(e.target.value)}
              disabled={formDisabled}
              placeholder="e.g. 1200"
            />
          </div>
          <div>
            <label className={`text-sm font-medium mb-1.5 block ${text.secondary}`}>Actual QR Sales</label>
            <input 
              type="number"
              step="0.01"
              className={posNativeInputClassName("py-2")}
              value={actualQR}
              onChange={e => setActualQR(e.target.value)}
              disabled={formDisabled}
              placeholder="e.g. 3500"
            />
          </div>
        </div>
        <Button
          type="submit"
          className={cn(posPrimaryActionClassName(), "w-full min-h-[44px] py-6 mt-2 border-0 shadow-lg")}
          disabled={formDisabled || !actualCash}
        >
          {submitSettlementMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
              Submitting…
            </>
          ) : expectedLoading ? (
            "Loading expected totals…"
          ) : (
            "Submit Shift Settlement"
          )}
        </Button>
      </form>
    </div>
  )
}
