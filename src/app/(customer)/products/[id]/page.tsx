"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Plus, Minus, Search } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Product not found");
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch product");
        }
        const data = await res.json();
        setProduct(data.data);
      } catch (err) {
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity} ${product.name} added to cart`);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) setQuantity((prev) => prev + 1);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-8 text-slate-400 hover:text-white hover:bg-slate-800 -ml-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-900/40 border border-slate-800 p-6 md:p-10 rounded-3xl backdrop-blur-sm shadow-2xl">
        {/* Product Image */}
        <div className="aspect-square bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800/50 shadow-inner">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700">
              <Search className="h-16 w-16 opacity-20 mb-4" />
              <p className="text-sm font-medium">No image available</p>
            </div>
          )}
          
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Low Stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wider uppercase">
            <Package className="h-4 w-4" />
            Product Info
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {product.name}
          </h1>
          
          <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent mb-6 inline-block">
            ${(product.price / 100).toFixed(2)}
          </div>
          
          <div className="prose prose-invert max-w-none mb-10 text-slate-400">
            <p className="text-lg leading-relaxed">
              {product.description || "This product doesn't have a description yet."}
            </p>
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-slate-400 mb-2 font-medium">Quantity</span>
                <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 w-32 shadow-inner">
                  <button 
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="p-3 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center font-bold text-white text-lg">
                    {quantity}
                  </span>
                  <button 
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    className="p-3 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-end h-full pt-6 ml-2">
                <span className="text-sm font-medium text-slate-500">
                  {product.stock} pieces available
                </span>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/30 transition-all hover:scale-[1.02]"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              <Plus className="h-5 w-5 mr-2" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
