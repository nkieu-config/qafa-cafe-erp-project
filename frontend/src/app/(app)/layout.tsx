import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user} hydratedFromServer>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
