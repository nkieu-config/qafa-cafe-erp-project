"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingCart, Package, Coffee, Truck, Users, 
  UserSquare2, Wallet, ChefHat, Wrench, Landmark, 
  MonitorPlay, Settings, ShieldCheck, Building2, Gift, ClipboardList,
  ChevronDown, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ClockInOutWidget } from "@/components/hr/ClockInOutWidget";

const menuGroups = [
  {
    group: "Overview & Analytics",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    ]
  },
  {
    group: "Store Operations",
    items: [
      { name: "Point of Sale", href: "/pos", icon: ShoppingCart, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
      { name: "Kitchen Display", href: "/kds", icon: MonitorPlay, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
      { name: "Inventory", href: "/inventory", icon: Package, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
      { name: "Customers (CRM)", href: "/crm", icon: Gift, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
    ]
  },
  {
    group: "Back Office",
    items: [
      { name: "Menu & Products", href: "/products", icon: ClipboardList, roles: ["SUPER_ADMIN", "MANAGER"] },
      { name: "Procurement", href: "/procurement", icon: Truck, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
      { name: "Central Kitchen", href: "/kitchen", icon: ChefHat, roles: ["SUPER_ADMIN", "MANAGER"] },
      { name: "Human Resources", href: "/hr", icon: UserSquare2, roles: ["SUPER_ADMIN", "MANAGER", "STAFF"] },
      { name: "Finance & Accounts", href: "/finance", icon: Landmark, roles: ["SUPER_ADMIN", "MANAGER"] },
      { name: "Asset Maintenance", href: "/assets", icon: Wrench, roles: ["SUPER_ADMIN", "MANAGER"] },
    ]
  },
  {
    group: "System Admin",
    items: [
      { name: "Branches", href: "/branches", icon: Building2, roles: ["SUPER_ADMIN"] },
      { name: "Users & Roles", href: "/users", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
    ]
  }
];

// Flatten for routing logic
const flatNavItems = menuGroups.flatMap(g => g.items);

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // State for collapsible menus (all open by default for Super Admin, except maybe Back Office)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Overview & Analytics": true,
    "Store Operations": true,
    "Back Office": false,
    "System Admin": false
  });

  // Automatically expand the group that contains the active item
  useEffect(() => {
    menuGroups.forEach(group => {
      const hasActiveItem = group.items.some(item => 
        pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
      );
      if (hasActiveItem) {
        setExpandedGroups(prev => ({ ...prev, [group.group]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="w-64 glass-panel border-r-slate-200/50 dark:border-r-slate-800/50 h-screen flex flex-col z-40 relative">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/30 dark:border-slate-800/50 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mr-3 shadow-sm">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-br from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">QafaCafe</span>
      </div>
      
      {user && (
        <div className="px-6 py-4 border-b border-slate-200/30 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/20 shrink-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-balance">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
        </div>
      )}

      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role || ''));
          if (visibleItems.length === 0) return null;
          
          const isExpanded = expandedGroups[group.group];

          return (
            <div key={group.group} className={`${groupIdx > 0 ? 'mt-4' : ''}`}>
              <button 
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center justify-between px-3 py-1 mb-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {group.group}
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              
              {isExpanded && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const activeItem = [...flatNavItems]
                      .sort((a, b) => b.href.length - a.href.length)
                      .find(nav => pathname === nav.href || (nav.href !== '/' && pathname.startsWith(`${nav.href}/`)));
                      
                    const isReallyActive = activeItem ? item.href === activeItem.href : (item.href === '/' && pathname === '/');
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm ${
                          isReallyActive
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20"
                            : "text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 interactive-item border border-transparent"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 mr-3 transition-colors ${isReallyActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {user && <ClockInOutWidget />}

      <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/50 shrink-0">
        <Button variant="outline" className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl interactive-item border-red-100 dark:border-red-900/50 bg-white/50 dark:bg-slate-900/50 transition-colors" onClick={() => void logout()}>
          Logout
        </Button>
      </div>
    </div>
  );
}
