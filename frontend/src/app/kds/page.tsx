"use client"

import { useState, useEffect } from "react"
import { AnimatedPage } from "@/components/animated-page"
import { getKdsOrders, updateOrderStatus } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Play } from "lucide-react"

export default function KdsPage() {
  const { activeBranchId } = useAuth()
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (!activeBranchId) return
    
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [activeBranchId])

  const fetchOrders = async () => {
    try {
      const data = await getKdsOrders(activeBranchId)
      setOrders(data || [])
    } catch (err) {
      console.error(err)
    }
  }

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
    return <div className="p-10 text-center">Please select a branch from the sidebar to view KDS.</div>
  }

  return (
    <AnimatedPage className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Kitchen Display System (KDS)
          </h1>
          <p className="text-slate-400 text-sm">Real-time order queue</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Live Sync
        </div>
      </div>

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
            const isPreparing = order.status === 'PREPARING'

            return (
              <div 
                key={order.id} 
                className={`flex-shrink-0 w-[350px] bg-white dark:bg-slate-800 rounded-xl shadow-md border-2 overflow-hidden flex flex-col ${
                  isLate ? 'border-red-500' : isPreparing ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className={`p-4 flex justify-between items-center text-white ${
                  isLate ? 'bg-red-500' : isPreparing ? 'bg-amber-500' : 'bg-slate-800'
                }`}>
                  <div className="font-bold text-xl">Order #{order.id}</div>
                  <div className="flex items-center gap-1 font-mono text-sm bg-black/20 px-2 py-1 rounded">
                    <Clock className="w-4 h-4" />
                    {waitTime} min
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start text-lg font-medium border-b border-slate-100 dark:border-slate-700 pb-2">
                      <div className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400">{item.quantity}x</span>
                        <span className="text-slate-800 dark:text-slate-200">{item.product.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  {order.status === 'PENDING' && (
                    <Button 
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-lg h-14"
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    >
                      <Play className="w-5 h-5 mr-2" /> Start
                    </Button>
                  )}
                  <Button 
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-lg h-14"
                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Done
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
