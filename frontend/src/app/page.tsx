"use client";

import { useEffect, useState } from "react";
import { getOrders, getIngredients } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, AlertTriangle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, ordersCount: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getIngredients()])
      .then(([orders, ingredients]) => {
        const revenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
        const lowStockCount = ingredients.filter((i: any) => i.stock <= i.minStock).length;
        setStats({
          revenue,
          ordersCount: orders.length,
          lowStockCount
        });
      })
      .catch((err) => toast.error("Failed to load dashboard data: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening at CafeSync today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Revenue</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">฿{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">All-time earnings</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Orders</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">+{stats.ordersCount}</div>
            <p className="text-xs text-slate-500 mt-1">Completed transactions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Low Stock Alerts</CardTitle>
            <div className="p-2 bg-rose-100 rounded-full">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">{stats.lowStockCount} Items</div>
            <p className="text-xs text-slate-500 mt-1">Require immediate restocking</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">System Status</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full">
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">Active</div>
            <p className="text-xs text-slate-500 mt-1">All services running normally</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center h-64 text-slate-400 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Activity className="text-slate-300" size={32} />
          </div>
          <p>Sales Chart will appear here.</p>
          <p className="text-xs mt-2">Generate data in POS to populate charts.</p>
        </div>
      </div>
    </div>
  );
}
