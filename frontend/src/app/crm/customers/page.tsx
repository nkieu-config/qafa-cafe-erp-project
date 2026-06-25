"use client";

import { useState } from "react";
import { useCustomers, useCustomer360, useCreateCustomer } from '@/hooks/domains/useCrmQueries';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Star, Award, Crown, Activity, AlertTriangle, CheckCircle2, History, Heart, ShoppingBag, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { Customer } from "@/types/api";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Customer 360 State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  const { data: customersData, isLoading: loading } = useCustomers(search);
  const customers = customersData || [];
  
  const { data: customer360, isLoading: loading360 } = useCustomer360(drawerOpen ? selectedCustomerId : null);
  const createMutation = useCreateCustomer();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    try {
      await createMutation.mutateAsync({ name, phone });
      toast.success("Customer created!");
      setName(""); setPhone("");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message || "Failed to create customer");
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'GOLD': return <Award className="w-4 h-4 text-amber-500" />;
      case 'SILVER': return <Star className="w-4 h-4 text-slate-400" />;
      default: return null;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400";
      case 'GOLD': return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case 'SILVER': return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
      default: return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30';
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/30';
      default: return '';
    }
  };

  const formatCurrency = (val: number) => `฿${val.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Customer Directory"
        icon={Users}
        description="Manage members, tiers, and loyalty points."
        actions={
          <Dialog>
            <DialogTrigger>
              <div className="flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl cursor-pointer text-sm font-medium">
                <UserPlus className="w-4 h-4 mr-2" />
                New Member
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Register Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold">Full Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Phone Number</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 0812345678" className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-md font-bold">Register</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="glass-card shadow-sm border-slate-200/60 dark:border-slate-800/60">
        <CardHeader className="pb-4">
          <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-lg">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input 
                placeholder="Search by phone..." 
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="h-10 rounded-lg px-6 font-bold shadow-sm">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="mt-2">
            <DataTable 
              loading={loading}
                columns={[
                  {
                    title: "Customer",
                    dataIndex: "name",
                    key: "name",
                    render: (name) => <span className="font-bold text-slate-800 dark:text-slate-200 text-md">{name}</span>
                  },
                  {
                    title: "Phone",
                    dataIndex: "phone",
                    key: "phone",
                    render: (phone) => <span className="text-slate-500 font-mono font-medium">{phone}</span>
                  },
                  {
                    title: "Tier",
                    key: "tier",
                    render: (_, record: Customer) => (
                      <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${getTierBadge(record.tier)}`}>
                        {getTierIcon(record.tier)}
                        {record.tier}
                      </Badge>
                    )
                  },
                  {
                    title: "Points",
                    dataIndex: "points",
                    key: "points",
                    render: (points) => (
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {points} <span className="text-xs font-bold text-emerald-400/70">pts</span>
                      </span>
                    )
                  },
                  {
                    title: "Joined",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (createdAt) => <span className="text-slate-500 font-medium text-sm">{new Date(createdAt).toLocaleDateString()}</span>
                  }
                ]}
                dataSource={customers}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedCustomerId(record.id);
                    setDrawerOpen(true);
                  },
                  className: "cursor-pointer"
                })}
                className="custom-antd-table border border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer 360 View Sheet (Shadcn) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-black text-xl">Customer 360° Profile</SheetTitle>
          </SheetHeader>
          
          {loading360 || !customer360 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="font-medium animate-pulse">Loading insights...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Profile */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{customer360.customer.name}</h3>
                  <p className="text-slate-500 font-mono font-medium">{customer360.customer.phone}</p>
                </div>
                <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-black uppercase rounded-xl ${getTierBadge(customer360.customer.tier)}`}>
                  {getTierIcon(customer360.customer.tier)}
                  {customer360.customer.tier}
                </Badge>
              </div>

              <div className="h-px bg-border my-4" />

              {/* Churn Risk */}
              <div className={`p-4 rounded-2xl border ${getChurnRiskColor(customer360.churnRisk)} flex items-start gap-3`}>
                {customer360.churnRisk === 'LOW' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider opacity-80 mb-1">Retention Status</h4>
                  <p className="font-black text-lg">
                    {customer360.churnRisk === 'LOW' ? 'Active Customer' : customer360.churnRisk === 'MEDIUM' ? 'At Risk (Slipping Away)' : 'High Churn Risk'}
                  </p>
                  <p className="text-sm font-medium opacity-80 mt-1">
                    Last ordered {customer360.daysSinceLastOrder} days ago
                  </p>
                </div>
              </div>

              {/* Tier Progression */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lifetime Spend</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(customer360.lifetimeSpend)}</p>
                  </div>
                  {customer360.nextTier !== 'MAX' && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Tier: {customer360.nextTier}</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(customer360.amountToNextTier)} to go</p>
                    </div>
                  )}
                </div>
                {customer360.nextTier !== 'MAX' ? (
                  <Progress value={parseFloat(customer360.progressPercentage.toFixed(1))} className="h-2 mt-3" />
                ) : (
                  <div className="mt-3 text-sm font-bold text-purple-600 bg-purple-100 p-2 rounded-lg text-center uppercase tracking-wider">
                    Maximum Tier Reached
                  </div>
                )}
              </div>

              {/* Favorite Drinks */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500"/> Top Favorites</h4>
                {customer360.favoriteDrinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customer360.favoriteDrinks.map((fav: { product: { name: string }; count: number }, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-rose-50 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 px-3 py-1.5 rounded-full">
                        <span className="font-bold text-rose-700 dark:text-rose-400">{fav.product.name}</span>
                        <span className="bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200 text-xs font-black px-2 py-0.5 rounded-full">{fav.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No purchase history yet.</p>
                )}
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><History className="w-4 h-4 text-blue-500"/> Recent Activity</h4>
                {customer360.recentOrders?.length > 0 ? (
                  <div className="space-y-3">
                    {customer360.recentOrders.map((order: any) => (
                      <div key={order.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-xs text-slate-500 font-medium">{order.items.length} items</p>
                          </div>
                        </div>
                        <div className="font-black text-slate-800 dark:text-slate-200">
                          {formatCurrency(order.netAmount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No orders found.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
