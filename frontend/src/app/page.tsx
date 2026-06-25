"use client";

import { useEffect, useState } from "react";
import { getBranches } from "@/lib/api";
import { useBranches } from '@/hooks/domains/useGeneralQueries';
import { useAnalyticsSummary, useTopProducts } from '@/hooks/domains/useReportsQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Award, Store, AlertTriangle, GripHorizontal, CheckCircle2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Branch } from "@/types/api";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AnimatedPage } from "@/components/animated-page";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

// --- Sortable Item Wrapper ---
function SortableWidget({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className} ${isDragging ? 'shadow-2xl ring-2 ring-emerald-500 rounded-xl opacity-80' : ''}`}>
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-4 right-4 z-20 p-2 cursor-grab active:cursor-grabbing text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 border shadow-sm"
      >
        <GripHorizontal className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Layout State
  const defaultLayout = ['sales', 'topBranch', 'lowStock', 'topProducts', 'salesChart'];
  const [widgetOrder, setWidgetOrder] = useState<string[]>(defaultLayout);

  useEffect(() => {
    // Load layout from localStorage
    const savedLayout = localStorage.getItem('executive_dashboard_layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        // Ensure salesChart is included for older saved layouts
        if (!parsed.includes('salesChart')) {
          parsed.push('salesChart');
        }
        setWidgetOrder(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // ✅ REACT QUERY HOOKS
  const { data: branches = [] } = useBranches();
  const { data: summary, isLoading: isLoadingSummary, isError: isSummaryError, error: summaryError, refetch: refetchSummary } = useAnalyticsSummary(selectedBranch);
  const { data: topProducts = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError, refetch: refetchProducts } = useTopProducts(selectedBranch);

  const loading = isLoadingSummary || isLoadingProducts;
  const hasError = isSummaryError || isProductsError;
  const errorMessage = (summaryError ?? productsError)?.message ?? "Failed to load dashboard metrics.";

  const handleRetry = () => {
    refetchSummary();
    refetchProducts();
  };

  const formatCurrency = (value: number) => `฿${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('executive_dashboard_layout', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'sales':
        return (
          <Card className="glass-card bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/20 h-full border-emerald-200 dark:border-emerald-800/50 shadow-emerald-100/50 dark:shadow-emerald-900/20">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Today's Sales</p>
                  <h3 className="text-4xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{formatCurrency(summary?.salesToday || 0)}</h3>
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`flex items-center text-sm font-bold px-2 py-1 rounded ${summary?.salesGrowth >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                      {summary?.salesGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                      {Math.abs(summary?.salesGrowth || 0).toFixed(1)}%
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">vs yesterday</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'topBranch':
        return (
          <Card className="glass-card bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20 h-full border-blue-200 dark:border-blue-900/50">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Top Branch Today</p>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">{summary?.topBranch?.name || "N/A"}</h3>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                    {formatCurrency(summary?.topBranch?.totalSales || 0)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 shadow-inner">
                  <Store className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'lowStock':
        return (
          <Card className="glass-card bg-gradient-to-br from-white to-rose-50/50 dark:from-slate-900 dark:to-rose-900/20 h-[300px] overflow-hidden flex flex-col border-rose-200 dark:border-rose-900/50">
            <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-900/50 shrink-0">
              <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400"><AlertTriangle className="w-5 h-5"/> Urgent Restock Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {summary?.lowStockAlerts?.length > 0 ? (
                <div className="divide-y divide-rose-100 dark:divide-rose-900/30">
                  {summary.lowStockAlerts.map((alert: { id: string, ingredientName: string, stock: number, minStock: number, branchName: string }) => (
                    <div key={alert.id} className="p-4 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/10">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{alert.ingredientName}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{alert.branchName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-rose-600 dark:text-rose-400 text-xl">{alert.stock}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-400 dark:text-rose-500">Min: {alert.minStock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                  <span className="font-bold text-lg text-emerald-600">All stock levels are optimal.</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'topProducts':
        return (
          <Card className="glass-card h-[400px] flex flex-col border-amber-200 dark:border-amber-900/50">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-2xl font-black"><Award className="w-6 h-6" /> Top 5 Best Sellers</CardTitle>
              <CardDescription className="text-slate-500 font-medium text-sm">Highest volume items today</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#475569', fontWeight: 700 }} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9', opacity: 0.5}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    // @ts-ignore
                    formatter={(value: number) => [`${value} units`, 'Sold']}
                    labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '4px'}}
                  />
                  <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]} barSize={32}>
                    {topProducts.map((entry: { name: string, quantity: number, revenue: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      case 'salesChart':
        return (
          <Card className="glass-card h-[400px] flex flex-col border-purple-200 dark:border-purple-900/50">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-purple-600 dark:text-purple-500 text-2xl font-black">Revenue Overview</CardTitle>
              <CardDescription className="text-slate-500 font-medium text-sm">7-day performance trend</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <SalesChart />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Drag widgets from the top right corner to customize layout.</p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val || "ALL")}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 font-bold h-12 shadow-sm rounded-xl">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className="rounded-xl font-medium">
              <SelectItem value="ALL">All Branches (HQ Overview)</SelectItem>
              {branches.map((b: Branch) => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col gap-4 items-center justify-center text-slate-500 font-bold text-xl animate-pulse">
          <Activity className="w-10 h-10 text-emerald-500 animate-spin-slow" />
          Syncing real-time metrics...
        </div>
      ) : hasError ? (
        <div className="h-64 flex flex-col gap-4 items-center justify-center text-center px-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <p className="text-slate-600 dark:text-slate-400 font-medium max-w-md">{errorMessage}</p>
          <Button variant="outline" onClick={handleRetry}>Try again</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 auto-rows-[minmax(200px,auto)]">
              {widgetOrder.map((id) => (
                <SortableWidget key={id} id={id} className={(id === 'topProducts' || id === 'salesChart') ? 'xl:col-span-2' : ''}>
                  {renderWidget(id)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </AnimatedPage>
  );
}
