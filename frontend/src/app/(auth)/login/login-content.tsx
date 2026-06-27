"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getErrorMessage } from "@/lib/errors";

export default function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginApi({ email, password });
      login(response.user);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to login"));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  const demoAccounts = [
    { label: "Admin", email: "admin@qafacafe.com" },
    { label: "Manager", email: "manager@qafacafe.com" },
    { label: "Staff", email: "staff.siam@qafacafe.com" },
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 text-slate-500">
        Loading…
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">QafaCafe</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 text-balance">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400">Sign in to your enterprise POS and management portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-600 dark:text-slate-300">Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@qafacafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 dark:text-slate-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 mt-4 group" disabled={loading}>
              {loading ? "Authenticating…" : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Demo Access</p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="w-full flex justify-between items-center font-mono text-xs rounded-lg px-3 py-2 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors text-left"
                >
                  <span>{account.label}:</span>
                  <span className="text-slate-900 dark:text-white">{account.email}</span>
                </button>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-xs px-1">
                <span>Password:</span>
                <span className="text-slate-900 dark:text-white">password123</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/20 blur-[130px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 p-12 max-w-xl text-center"
        >
          <div className="rounded-3xl border border-white/10 p-10 backdrop-blur-2xl bg-white/5 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Enterprise Grade Efficiency</h2>
            <p className="text-slate-300 leading-relaxed mb-8">
              QafaCafe streamlines your operations from point-of-sale to inventory and human resources, giving you the clarity needed to scale.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-emerald-400 font-bold text-xl mb-1">99.9%</div>
                <div className="text-slate-400 text-xs uppercase tracking-wider">Uptime</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-teal-400 font-bold text-xl mb-1">2.4x</div>
                <div className="text-slate-400 text-xs uppercase tracking-wider">Faster Checkout</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
