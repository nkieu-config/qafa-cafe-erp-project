"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ChevronDown, Coffee, Loader2 } from "lucide-react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { GITHUB_REPO_URL } from "@/lib/brand";
import { getErrorMessage } from "@/lib/errors";
import {
  authBrandMarkClassName,
  authBrandTaglineClassName,
  authDemoChipClassName,
  authDemoCredentialsClassName,
  authDemoCredentialsPasswordRowClassName,
  authDemoCredentialsToggleClassName,
  authDemoPanelClassName,
  authHeroGlowClassName,
  authHeroPanelClassName,
  authGitHubLinkClassName,
  authHeroPanelInnerClassName,
  authInputClassName,
  authLeftPanelClassName,
  authLoadingClassName,
  authPageShellClassName,
  authPrimaryButtonClassName,
} from "@/lib/theme/auth";
import { LoginHeroCard } from "./login-hero";
import { text } from "@/lib/theme/surface";
import { typeHeadingClassName } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";

const DEMO_PASSWORD = "password123";

type DemoAccount = {
  id: string;
  label: string;
  email: string;
  hint: string;
};

const demoAccounts: DemoAccount[] = [
  {
    id: "admin",
    label: "Admin",
    email: "admin@branchbrew.dev",
    hint: "Full system access — organization, settings, audit",
  },
  {
    id: "manager",
    label: "Manager",
    email: "manager@branchbrew.dev",
    hint: "Finance, HR, procurement, and reports",
  },
  {
    id: "staff",
    label: "Staff",
    email: "staff.siam@branchbrew.dev",
    hint: "POS terminal, KDS, and inventory",
  },
];

export default function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDemoId, setLoadingDemoId] = useState<string | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const { login, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  const loginWithCredentials = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    try {
      const response = await loginApi({ email: loginEmail, password: loginPassword });
      login(response.user);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to login"));
    } finally {
      setLoading(false);
      setLoadingDemoId(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setSelectedDemoId(account.id);
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setLoadingDemoId(account.id);
    await loginWithCredentials(account.email, DEMO_PASSWORD);
  };

  const isDemoBusy = loadingDemoId !== null;

  if (!isInitialized) {
    return <div className={authLoadingClassName()}>Loading…</div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={authPageShellClassName()}>
      <div className={authLeftPanelClassName()}>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={authGitHubLinkClassName()}
        >
          <GitHubIcon />
          Source on GitHub
        </a>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className={authBrandMarkClassName()}>
              <Coffee className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className={typeHeadingClassName("text-xl tracking-tight")}>BranchBrew</span>
              <p className={authBrandTaglineClassName()}>Multi-branch cafe ERP</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className={typeHeadingClassName("text-3xl tracking-tight mb-2 text-balance lg:text-4xl")}>
              Sign in
            </h1>
            <p className={cn("text-sm", text.muted)}>
              POS, inventory, kitchen & payroll for cafe chains.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={text.secondary}>Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@branchbrew.dev"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemoId(null);
                }}
                autoComplete="username"
                required
                className={authInputClassName()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={text.secondary}>Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedDemoId(null);
                }}
                autoComplete="current-password"
                required
                className={authInputClassName()}
              />
            </div>

            <button
              type="submit"
              className={authPrimaryButtonClassName()}
              disabled={loading || isDemoBusy}
            >
              {loading && !loadingDemoId ? "Signing in…" : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" />
                </span>
              )}
            </button>
          </form>

          <div className={authDemoPanelClassName()}>
            <p className={cn("mb-3 text-center text-xs", text.muted)}>Quick demo</p>
            <div className="flex gap-2" role="group" aria-label="Demo accounts">
              {demoAccounts.map((account) => {
                const isActive = selectedDemoId === account.id;
                const isLoading = loadingDemoId === account.id;

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading || isDemoBusy}
                    className={authDemoChipClassName(isActive)}
                    title={account.hint}
                    aria-label={`Sign in as demo ${account.label}: ${account.hint}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      account.label
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCredentials((open) => !open)}
              className={authDemoCredentialsToggleClassName()}
              aria-expanded={showCredentials}
              aria-controls="demo-credentials"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform motion-reduce:transition-none",
                  showCredentials && "rotate-180",
                )}
                aria-hidden
              />
              {showCredentials ? "Hide credentials" : "Credentials"}
            </button>

            {showCredentials ? (
              <div id="demo-credentials" className={authDemoCredentialsClassName()}>
                {demoAccounts.map((account) => (
                  <p key={account.email} className="flex justify-between gap-2">
                    <span>{account.label}</span>
                    <span className={cn("text-right break-all", text.primary)}>{account.email}</span>
                  </p>
                ))}
                <p className={authDemoCredentialsPasswordRowClassName()}>
                  <span>Password</span>
                  <span className={text.primary}>{DEMO_PASSWORD}</span>
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>

      <div className={authHeroPanelClassName()}>
        <div className={authHeroGlowClassName("top-[-10%] left-[-10%] w-[50%] h-[50%]")} />
        <div className={authHeroGlowClassName("bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[130px]")} />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={authHeroPanelInnerClassName()}
        >
          <LoginHeroCard />
        </motion.div>
      </div>
    </div>
  );
}
