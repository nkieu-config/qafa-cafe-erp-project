"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Coffee, Settings, Truck, Users, TicketPercent, UserSquare2, BarChart3, Wallet, Trash2, Banknote, ChefHat, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ClockInOutWidget } from "@/components/hr/ClockInOutWidget";

import { RoleGuard } from "@/components/RoleGuard";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
  { name: "POS Settlement", href: "/pos/settlement", icon: Wallet, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
  { name: "Inventory", href: "/inventory", icon: Package, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Waste Log", href: "/inventory/waste", icon: Trash2, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
  { name: "Procurement", href: "/procurement", icon: Truck, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Equipment", href: "/procurement/equipment", icon: Wrench, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
  { name: "Promotions", href: "/promotions", icon: TicketPercent, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Kitchen Display", href: "/kds", icon: ChefHat, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
  { name: "Employee Directory", href: "/hr/employees", icon: UserSquare2, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Payroll Management", href: "/hr/payroll", icon: Banknote, roles: ["SUPER_ADMIN", "MANAGER"] },
  { name: "Finance HQ", href: "/finance", icon: Wallet, roles: ["SUPER_ADMIN"] },
  { name: "Reports & Costing", href: "/reports/costing", icon: BarChart3, roles: ["SUPER_ADMIN", "MANAGER"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === '/login') return null;

  return (
    <div className="w-64 glass-panel border-r-slate-200/50 dark:border-r-slate-800/50 h-screen flex flex-col z-40 relative">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/30 dark:border-slate-800/50">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mr-3 shadow-sm">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-br from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">QafaCafe</span>
      </div>
      
      {user && (
        <div className="px-6 py-4 border-b border-slate-200/30 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/20">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-balance">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const activeItem = [...navItems]
            .sort((a, b) => b.href.length - a.href.length)
            .find(nav => pathname === nav.href || (nav.href !== '/' && pathname.startsWith(`${nav.href}/`)));
            
          const isReallyActive = activeItem ? item.href === activeItem.href : (item.href === '/' && pathname === '/');
          
          return (
            <RoleGuard key={item.name} allowedRoles={item.roles}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-colors duration-300 font-semibold text-sm ${
                  isReallyActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 interactive-item border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 mr-2.5 transition-colors ${isReallyActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.name}
              </Link>
            </RoleGuard>
          );
        })}
      </nav>
      
      {user && <ClockInOutWidget />}

      <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/50">
        <Button variant="outline" className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl interactive-item border-red-100 dark:border-red-900/50 bg-white/50 dark:bg-slate-900/50" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
