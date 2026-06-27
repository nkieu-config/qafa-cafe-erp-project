"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatedPage } from "@/components/animated-page"
import { PageHeader } from "@/components/shared/page-header"
import { getKdsOrders, updateOrderStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Play } from "lucide-react"
import { Order, OrderItem, OrderStatus } from "@/types/api"
import { formatQueueNumber } from "@/lib/queue"
import { BranchEmptyState } from "@/components/shared/branch-empty-state"

const KDS_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING']

function mergeKdsOrders(existing: Order[], incoming: Order[]): Order[] {
  const byId = new Map<number, Order>()
  for (const order of [...existing, ...incoming]) {
    if (KDS_STATUSES.includes(order.status)) {
      byId.set(order.id, order)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export default function KdsPage() {
  const { activeBranchId } = useAuth()
  const { socket, isConnected } = useSocket()
  const [orders, setOrders] = useState<Order[]>([])

  const fetchOrders = useCallback(async () => {
    if (!activeBranchId) return
    try {
      const data = await getKdsOrders(activeBranchId)
      setOrders(mergeKdsOrders([], data || []))
    } catch (err) {
      console.error(err)
    }
  }, [activeBranchId])

  useEffect(() => {
    if (!activeBranchId) return
    
    fetchOrders()
    // We no longer strictly need polling, but we can keep a slow fallback interval
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [activeBranchId, fetchOrders])

  useEffect(() => {
    if (!socket || !activeBranchId) return

    const handleOrderCreated = (newOrder: Order) => {
      if (newOrder.branchId !== activeBranchId) return
      if (!KDS_STATUSES.includes(newOrder.status)) return
      setOrders((prev) => mergeKdsOrders(prev, [newOrder]))
    }

    const handleOrderStatusUpdated = (data: { orderId: number, status: OrderStatus }) => {
      setOrders((prev) => {
        if (data.status === 'COMPLETED' || !KDS_STATUSES.includes(data.status)) {
          return prev.filter(o => o.id !== data.orderId)
        }
        return mergeKdsOrders(
          prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o),
          [],
        )
      })
    }

    socket.on('orderCreated', handleOrderCreated)
    socket.on('orderStatusUpdated', handleOrderStatusUpdated)

    return () => {
      socket.off('orderCreated', handleOrderCreated)
      socket.off('orderStatusUpdated', handleOrderStatusUpdated)
    }
  }, [socket, activeBranchId])

  // Removed old fetchOrders to prevent duplicate

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      fetchOrders()
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate wait time
  const getWaitTimeMinutes = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime()
    return Math.floor(diff / 60000)
  }

  if (!activeBranchId) {
    return (
      <AnimatedPage className="h-full flex flex-col space-y-4">
        <PageHeader title="Kitchen Display System (KDS)" description="Real-time order queue" />
        <BranchEmptyState description="Select a branch in the top bar to view the kitchen display." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="h-full flex flex-col space-y-4">
      <PageHeader
        title="Kitchen Display System (KDS)"
        description="Real-time order queue"
        actions={
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Live Sync
          </div>
        }
      />

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full items-start">
          {orders.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No pending orders. Kitchen is clear!
            </div>
          )}

          {orders.map((order) => {
            const waitTime = getWaitTimeMinutes(order.createdAt)
            const isLate = waitTime >= 10
            const isWarning = waitTime >= 5 && waitTime < 10

            const headerColorClass = isLate 
              ? 'bg-rose-600' 
              : isWarning 
                ? 'bg-amber-500' 
                : 'bg-emerald-500';

            const borderClass = isLate
              ? 'border-rose-600 animate-[pulse_2s_ease-in-out_infinite]'
              : isWarning
                ? 'border-amber-500'
                : 'border-emerald-500';

            return (
              <div 
                key={order.id} 
                className={`flex-shrink-0 w-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-4 overflow-hidden flex flex-col transition-all ${borderClass}`}
              >
                {/* Header */}
                <div className={`p-5 flex justify-between items-center text-white ${headerColorClass}`}>
                  <div>
                    <div className="font-black text-4xl tracking-wider tabular-nums">
                      #{formatQueueNumber(order.queueNumber)}
                    </div>
                    <div className="text-xs opacity-80 font-mono mt-0.5">
                      Order ref {order.id}
                    </div>
                    <div className="text-sm opacity-90 font-medium flex items-center gap-2 mt-1">
                      {order.status === 'PREPARING' ? 'กำลังทำ (Preparing)' : 'รอคิว (Pending)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xl font-bold bg-black/20 px-3 py-2 rounded-lg shadow-inner">
                    <Clock className="w-6 h-6" />
                    {waitTime} min
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {order.items?.map((item: OrderItem) => (
                    <div key={item.id} className="border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div className="flex gap-3 items-start">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-2xl">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-100 font-black text-2xl leading-tight">{item.product?.name}</span>
                          {item.notes && (
                            <div className="mt-2 text-xl font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded inline-block">
                              + {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                  {order.status === 'PENDING' && (
                    <Button 
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-2xl h-24 shadow-lg active:scale-95 transition-transform"
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    >
                      <Play className="w-8 h-8 mr-2" /> START
                    </Button>
                  )}
                  <Button 
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl h-24 shadow-lg active:scale-95 transition-transform"
                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                  >
                    <CheckCircle2 className="w-8 h-8 mr-2" /> DONE
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AnimatedPage>
  )
}
