"use client";

import { useEffect, useState } from "react";
import { getSalesTrends, getTopProducts, getProfitLoss, getBranches } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Package, Activity, Award } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, Cell } from "recharts";

export default function AnalyticsDashboard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);

  useEffect(() => {
    getBranches().then(setBranches).catch(console.error);
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = selectedBranch === "ALL" ? undefined : parseInt(selectedBranch);
      const [sales, products, pl] = await Promise.all([
        getSalesTrends(branchId),
        getTopProducts(branchId),
        getProfitLoss(branchId),
      ]);
      setSalesData(sales);
      setTopProducts(products);
      setProfitLoss(pl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `฿${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Advanced Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Track performance, sales trends, and profitability.</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val || "ALL")}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading analytics data...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{formatCurrency(profitLoss?.revenue || 0)}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-900 dark:to-orange-900/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gross Profit</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{formatCurrency(profitLoss?.grossProfit || 0)}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card bg-gradient-to-br from-white to-red-50/50 dark:from-slate-900 dark:to-red-900/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses & Payroll</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{formatCurrency((profitLoss?.expenses || 0) + (profitLoss?.payroll || 0))}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-100/50 dark:shadow-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Net Profit</p>
                    <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">{formatCurrency(profitLoss?.netProfit || 0)}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-none">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trends Chart */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Trends (Last 7 Days)</CardTitle>
                <CardDescription>Daily revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `฿${value}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                        labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Most popular products by volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} width={100} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} units`, 'Sold']}
                      />
                      <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]} barSize={24}>
                        {topProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
