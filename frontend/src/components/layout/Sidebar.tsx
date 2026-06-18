import Link from 'next/link';
import { Home, ShoppingCart, Package } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col p-4 shadow-xl">
      <div className="text-2xl font-bold mb-8 text-center tracking-wider text-amber-500 mt-4">CafeSync ERP</div>
      <nav className="flex-1 space-y-2">
        <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors">
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/pos" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors">
          <ShoppingCart size={20} />
          <span>Point of Sale (POS)</span>
        </Link>
        <Link href="/inventory" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors">
          <Package size={20} />
          <span>Inventory</span>
        </Link>
      </nav>
      <div className="mt-auto p-4 text-xs text-slate-500 text-center">
        v1.0.0 Portfolio Project
      </div>
    </aside>
  );
}
