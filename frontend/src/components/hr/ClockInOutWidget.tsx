"use client";

import { useEffect, useState } from "react";
import { getActiveClockIn, clockIn, clockOut } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ClockInOutWidget() {
  const { user, activeBranchId } = useAuth();
  const [activeRecord, setActiveRecord] = useState<{ clockIn: string } | null>(null);
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
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
      toast.success("Clocked out successfully!");
      fetchStatus();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10 flex flex-col items-center">
      {activeRecord ? (
        <div className="w-full space-y-3 p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="animate-pulse"/> Active Shift</span>
            <span className="font-mono bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400">{elapsed}</span>
          </div>
          <Button onClick={handleClockOut} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg interactive-item shadow-md border border-slate-700 dark:border-slate-600" size="sm">
            Clock Out
          </Button>
        </div>
      ) : (
        <Button onClick={handleClockIn} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl interactive-item shadow-md border border-emerald-400" size="default">
          <Clock size={16} className="mr-2" /> Clock In
        </Button>
      )}
    </div>
  );
}
