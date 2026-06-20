"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Star, Award, Crown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (q?: string) => {
    setLoading(true);
    try {
      const query = q ? `?search=${encodeURIComponent(q)}` : '';
      const data = await fetchAPI(`/customers${query}`);
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
      });
      toast.success("Customer registered successfully!");
      setName(""); setPhone("");
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Customers & Loyalty</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your members, points, and tiers.</p>
        </div>
        
        <Dialog>
          <DialogTrigger>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              <UserPlus className="w-4 h-4 mr-2" />
              New Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 0812345678" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Register</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search by name or phone..."
                className="pl-9 bg-white/50 dark:bg-slate-900/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No customers found.</TableCell></TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono">{c.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getTierBadge(c.tier)}`}>
                        {getTierIcon(c.tier)}
                        {c.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      {c.points} <span className="text-xs font-medium text-slate-400">pts</span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
