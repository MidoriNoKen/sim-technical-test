"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, PackageX, Plus } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";

function StorefrontContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const [localSearch, setLocalSearch] = useState(search);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  const currentParamsString = searchParams.toString();
  const [prevParamsString, setPrevParamsString] = useState(currentParamsString);

  if (currentParamsString !== prevParamsString) {
    setPrevParamsString(currentParamsString);
    setProducts([]);
    setPage(1);
    setHasNextPage(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const query = new URLSearchParams();
        query.set("page", page.toString());
        query.set("limit", "12");
        if (search) query.set("search", search);
        if (minPrice) query.set("minPrice", minPrice);
        if (maxPrice) query.set("maxPrice", maxPrice);

        const res = await fetch(`/api/products?${query.toString()}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            toast.error("Please login to view products");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch products");
        }
        
        const json = await res.json();
        
        if (!cancelled) {
          if (page === 1) {
            setProducts(json.data);
          } else {
            setProducts((prev) => [...prev, ...json.data]);
          }
          setHasNextPage(json.pagination.page < json.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Failed to load products");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [page, search, minPrice, maxPrice, router]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !loading && !loadingMore) {
        setPage((p) => p + 1);
      }
    },
    [hasNextPage, loading, loadingMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
      rootMargin: "100px",
    });
    
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [handleObserver]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (localSearch) params.set("search", localSearch);
    else params.delete("search");
    
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyFilters();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header and Filters */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Our Products</h1>
          <p className="text-slate-400">Discover our latest collection of premium items.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-slate-950/50 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 h-10 w-full"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={applyFilters} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 h-10">
            Search
          </Button>
        </div>
      </div>

      {/* Loading state for initial load */}
      {loading && page === 1 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/20 animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 relative z-10" />
          </div>
          <p className="text-slate-400 animate-pulse font-medium tracking-wide">Loading amazing products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4 bg-slate-900/20 border border-slate-800/50 rounded-2xl backdrop-blur-sm">
          <div className="bg-slate-800/50 p-4 rounded-full">
            <PackageX className="h-10 w-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-white">No products found</h3>
          <p className="text-slate-400 max-w-md">We couldn't find any products matching your search criteria. Try adjusting your filters.</p>
          <Button variant="outline" onClick={() => router.push("/")} className="mt-4 border-slate-700 hover:bg-slate-800 text-slate-300">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="bg-slate-900/60 border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group flex flex-col h-full hover:shadow-xl hover:shadow-indigo-900/20 hover:-translate-y-1">
              {/* Product Image placeholder */}
              <div className="aspect-square bg-slate-950 relative overflow-hidden cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-700">
                    <Search className="h-12 w-12 opacity-20" />
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="absolute top-3 right-3 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-md">
                    Low Stock
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-md">
                    Out of Stock
                  </span>
                )}
              </div>
              
              <CardContent className="p-5 flex-grow cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
                <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed min-h-[40px]">
                  {product.description || "No description available."}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                    Rp {product.price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {product.stock} available
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="p-5 pt-0 border-t border-slate-800/50 mt-auto bg-slate-900/30">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/20 group-hover:shadow-indigo-600/20 mt-4" 
                  disabled={product.stock === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 1);
                    toast.success(`${product.name} added to cart`);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="py-4 mt-8 flex justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full backdrop-blur-sm border border-indigo-500/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Loading more products...</span>
          </div>
        )}
        {!hasNextPage && products.length > 0 && !loading && (
          <p className="text-slate-500 text-sm font-medium">You've reached the end of the catalog</p>
        )}
      </div>
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <StorefrontContent />
    </Suspense>
  );
}
