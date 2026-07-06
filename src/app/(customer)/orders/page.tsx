"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Package, ArrowLeft, Calendar, CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Simple interface matching the nested include structure of Order
interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/login?redirect=/orders");
            return;
          }
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data.data);
      } catch (err) {
        toast.error("Failed to load your order history");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-medium tracking-wide">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FileText className="h-8 w-8 mr-4 text-indigo-400" />
            My Order History
          </h1>
          <p className="text-slate-400 mt-2 ml-12">View and track all your past purchases</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")} className="hidden sm:flex border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 bg-slate-900/40 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <div className="bg-slate-800/50 p-6 rounded-full border border-slate-700">
            <Package className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white">No orders yet</h3>
          <p className="text-slate-400 max-w-md">
            You haven't placed any orders. Start browsing our collection and find something you love!
          </p>
          <Button onClick={() => router.push("/")} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-lg">
              <CardHeader className="bg-slate-950/50 border-b border-slate-800/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-200">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription className="flex items-center text-slate-400 mt-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-400 font-medium">Total Amount</p>
                      <p className="text-xl font-bold text-emerald-400">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      order.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      order.status === 'SHIPPED' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                  Order Items
                </h4>
                <div className="space-y-4">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                      <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-700" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h5 className="font-semibold text-slate-200 truncate">
                          {item.product?.name || "Unknown Product"}
                        </h5>
                        <p className="text-sm text-slate-400 mt-1">
                          Qty: {item.quantity} × Rp {item.priceAtPurchase.toLocaleString("id-ID")}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-300">
                          Rp {(item.priceAtPurchase * item.quantity).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!order.orderItems || order.orderItems.length === 0) && (
                    <div className="flex items-center justify-center p-4 text-slate-500 bg-slate-950/30 rounded-xl">
                      <CircleAlert className="h-5 w-5 mr-2" />
                      No items found for this order
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
