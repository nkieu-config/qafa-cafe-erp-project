"use client";

import { useEffect, useState } from "react";
import { getMyAttendance, getMyShifts, getPayroll, getHrUsers, updateHourlyRate } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserSquare2, Clock, Calendar, DollarSign, Edit2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function HrDashboardPage() {
  const { user, activeBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState('timesheet');
  const [loading, setLoading] = useState(true);

  // States
  const [attendance, setAttendance] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab, activeBranchId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'timesheet') {
        const data = await getMyAttendance();
        setAttendance(data);
      } else if (activeTab === 'shifts') {
        const data = await getMyShifts();
        setShifts(data);
      } else if (activeTab === 'payroll' && activeBranchId) {
        const now = new Date();
        const data = await getPayroll(activeBranchId, now.getMonth() + 1, now.getFullYear());
        setPayroll(data);
        const users = await getHrUsers(activeBranchId);
        setStaff(users);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async (userId: number) => {
    const rate = prompt("Enter new hourly rate (THB):");
    if (rate && !isNaN(Number(rate))) {
      try {
        await updateHourlyRate(userId, Number(rate));
        toast.success("Hourly rate updated");
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const formatDuration = (hours: number | null) => {
    if (hours === null) return "In Progress";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading && attendance.length === 0 && shifts.length === 0 && payroll.length === 0) {
    return <div className="p-10 text-center">Loading HR Dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <UserSquare2 className="text-emerald-600" /> Human Resources
        </h1>
        <p className="text-slate-500">Manage time, attendance, and payroll.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button 
          className={`pb-2 px-1 font-semibold ${activeTab === 'timesheet' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('timesheet')}
        >
          My Timesheet
        </button>
        <button 
          className={`pb-2 px-1 font-semibold ${activeTab === 'shifts' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
          onClick={() => setActiveTab('shifts')}
        >
          My Shifts
        </button>
        {user?.role !== 'STAFF' && (
          <button 
            className={`pb-2 px-1 font-semibold ${activeTab === 'payroll' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('payroll')}
          >
            Payroll Calculator (Manager)
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {activeTab === 'timesheet' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Total Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{new Date(a.clockIn).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(a.clockIn).toLocaleTimeString()}</TableCell>
                  <TableCell>{a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '-'}</TableCell>
                  <TableCell>{formatDuration(a.totalHours)}</TableCell>
                  <TableCell>
                    {a.clockOut ? <Badge variant="outline" className="bg-slate-100 text-slate-700">Completed</Badge> 
                      : <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 animate-pulse">Active</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No records found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}

        {activeTab === 'shifts' && (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Shift Scheduling Coming Soon</h3>
            <p>You currently have no assigned shifts.</p>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="p-6 space-y-6">
            {!activeBranchId && <div className="text-red-500 text-center font-bold">Please select a branch to view payroll.</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="text-emerald-500" /> Payroll Overview (This Month)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Estimated Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.map((p) => (
                        <TableRow key={p.userId}>
                          <TableCell className="font-semibold">{p.name}</TableCell>
                          <TableCell className="text-right">{p.totalHours.toFixed(2)} hrs</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">฿{p.totalPay.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {payroll.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4">No payroll data for this month</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Settings className="text-slate-500" /> Hourly Rates Config</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff</TableHead>
                        <TableHead>Rate/Hr</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.role}</div>
                          </TableCell>
                          <TableCell className="font-mono">฿{s.hourlyRate}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateRate(s.id)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
