"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Loader2, PackageX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, itemCount } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setCheckingOut(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error("Please login to complete your purchase");
          router.push("/login?redirect=/cart");
          return;
        }
        throw new Error("Failed to place order");
      }

      toast.success("Order placed successfully!");
      clearCart();
      router.push("/orders");
    } catch (error) {
      toast.error("An error occurred during checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
        <div className="bg-slate-900/50 p-6 rounded-full border border-slate-800 shadow-xl shadow-slate-950/50">
          <ShoppingCart className="h-16 w-16 text-slate-500" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Your cart is empty</h2>
        <p className="text-slate-400 text-lg">
          Looks like you haven't added any products to your cart yet.
        </p>
        <Button 
          onClick={() => router.push("/")} 
          size="lg"
          className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8"
        >
          Start Shopping
        </Button>
      </div>
    );
  }

  const taxRate = 0.1; // 10% tax for display purposes
  const taxAmount = totalPrice * taxRate;
  const finalTotal = totalPrice + taxAmount;

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
        <ShoppingCart className="h-8 w-8 mr-4 text-indigo-400" />
        Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div 
              key={item.product.id} 
              className="flex flex-col sm:flex-row items-center gap-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-lg hover:border-slate-700 transition-colors"
            >
              <div 
                className="w-full sm:w-28 h-28 bg-slate-950 rounded-xl flex-shrink-0 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/products/${item.product.id}`)}
              >
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PackageX className="h-8 w-8 text-slate-700" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow flex flex-col sm:flex-row justify-between w-full">
                <div className="space-y-1 mb-4 sm:mb-0">
                  <h3 
                    className="font-bold text-lg text-white hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1"
                    onClick={() => router.push(`/products/${item.product.id}`)}
                  >
                    {item.product.name}
                  </h3>
                  <p className="text-emerald-400 font-bold text-xl">
                    ${(item.product.price / 100).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-semibold text-white text-sm">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-start mt-6">
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-slate-400 border-slate-800 hover:bg-slate-900"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-lg sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold">${(totalPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (10%)</span>
                <span className="font-semibold">${(taxAmount / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-4 flex justify-between text-white text-lg font-bold">
                <span>Total</span>
                <span className="text-emerald-400">${(finalTotal / 100).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCheckout} 
              disabled={checkingOut}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02]"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
