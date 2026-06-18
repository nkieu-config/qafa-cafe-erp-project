"use client";

import { useEffect, useState } from "react";
import { getActiveClockIn, clockIn, clockOut } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ClockInOutWidget() {
  const { user, activeBranchId } = useAuth();
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!activeRecord) {
      setElapsed("");
      return;
    }

    const start = new Date(activeRecord.clockIn).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsed(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRecord]);

  const fetchStatus = async () => {
    try {
      const record = await getActiveClockIn();
      setActiveRecord(record);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!activeBranchId) {
      toast.error("Please select a branch first.");
      return;
    }
    try {
      await clockIn(activeBranchId);
      toast.success("Clocked in successfully!");
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
      toast.success("Clocked out successfully!");
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col items-center">
      {activeRecord ? (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-emerald-600 font-semibold text-sm">
            <span className="flex items-center gap-1"><CheckCircle2 size={16}/> Clocked In</span>
            <span className="font-mono">{elapsed}</span>
          </div>
          <Button onClick={handleClockOut} className="w-full bg-slate-800 hover:bg-slate-900" size="sm">
            Clock Out
          </Button>
        </div>
      ) : (
        <Button onClick={handleClockIn} className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Clock size={16} className="mr-2" /> Clock In
        </Button>
      )}
    </div>
  );
}
