"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchAPI } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/endpoints";
import { setStoredBranchId } from "@/lib/branch-storage";
import type { SessionUser } from "@/types/auth";

type AuthContextType = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (user: SessionUser) => void;
  logout: () => Promise<void>;
  activeBranchId: number | null;
  setActiveBranchId: (id: number | null) => void;
  isInitialized: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: SessionUser;
  hydratedFromServer?: boolean;
};

export function AuthProvider({
  children,
  initialUser,
  hydratedFromServer = false,
}: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(initialUser?.branchId ?? null);
  const [isInitialized, setIsInitialized] = useState(hydratedFromServer);
  const router = useRouter();

  const setActiveBranchId = useCallback(
    (id: number | null) => {
      setActiveBranchIdState(id);
      if (user?.role === "SUPER_ADMIN") {
        setStoredBranchId(id);
      }
    },
    [user?.role],
  );

  useEffect(() => {
    if (hydratedFromServer) return;

    let cancelled = false;

    fetchAPI(API_ENDPOINTS.auth.me)
      .then((profile: SessionUser) => {
        if (cancelled) return;
        setUser(profile);
        setActiveBranchIdState(profile.branchId ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setActiveBranchIdState(null);
      })
      .finally(() => {
        if (!cancelled) setIsInitialized(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hydratedFromServer]);

  const login = (newUser: SessionUser) => {
    setUser(newUser);
    setActiveBranchIdState(newUser.branchId ?? null);
    setIsInitialized(true);
    const landing = newUser.role === "STAFF" ? "/pos/terminal" : "/";
    router.push(landing);
    toast.success("Logged in successfully");
  };

  const logout = useCallback(async () => {
    try {
      await fetchAPI(API_ENDPOINTS.auth.logout, { method: "POST" });
    } catch {
      // Clear client state even if the server call fails.
    }
    setUser(null);
    setActiveBranchIdState(null);
    router.push("/login");
    toast.success("Logged out successfully");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user != null,
        login,
        logout,
        activeBranchId,
        setActiveBranchId,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
