"use client";

import { useEffect, useState } from "react";
import { getProducts, createOrder } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Coffee, ShoppingBag } from "lucide-react";

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => toast.error("Failed to load products: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const items = cart.map(item => ({ productId: item.product.id, quantity: item.quantity }));
      // Using a dummy userId (1) for now since we haven't implemented full Auth
      await createOrder({ userId: 1, items });
      toast.success("Order completed successfully! Ingredients have been deducted.");
      setCart([]);
    } catch (err: any) {
      toast.error("Checkout failed: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading POS...</div>;

  return (
    <div className="flex h-full gap-6">
      {/* Products Grid */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <Coffee className="text-amber-600" /> Menu
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:border-amber-400 hover:shadow-md transition-all active:scale-95 bg-white border-slate-200"
              onClick={() => addToCart(product)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg text-slate-800">{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex justify-between items-center">
                <span className="font-bold text-amber-600 text-lg">฿{product.price}</span>
                <Button variant="secondary" size="sm" className="bg-amber-100 text-amber-700 hover:bg-amber-200">Add</Button>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed border-slate-300">
              No products found. Please add them via database first.
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingBag size={20} className="text-amber-500" /> Current Order
          </h2>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <div className="font-semibold text-slate-800">{item.product.name}</div>
                <div className="text-sm text-slate-500">฿{item.product.price} x {item.quantity}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700">฿{item.product.price * item.quantity}</span>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0" onClick={() => removeFromCart(item.product.id)}>
                  ✕
                </Button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-slate-400 mt-10 flex flex-col items-center gap-2">
              <ShoppingBag size={48} className="opacity-20" />
              <span>Cart is empty</span>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 rounded-b-xl border-t border-slate-200">
          <div className="flex justify-between text-xl font-bold mb-4 text-slate-800">
            <span>Total:</span>
            <span className="text-amber-600">฿{total.toLocaleString()}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 transition-all" 
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Confirm & Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
