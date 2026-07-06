"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Package, Tag, Layers, Clock, CalendarDays, Edit, CircleAlert, Image as ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  createdAt: string
  updatedAt: string
  images?: string[]
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`, {
          credentials: "include",
        })

        if (res.status === 401) {
          router.push(`/login?redirect=/admin/products/${id}`)
          return
        }

        const data = await res.json()

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load product details")
          return
        }

        setProduct(data.data)
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading product details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-slate-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-6 text-center text-rose-400 shadow-lg">
          <CircleAlert className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>{error || "Product not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Button variant="ghost" onClick={() => router.push("/admin/products")} className="mb-4 text-slate-400 hover:text-slate-200 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {product.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            <Package className="mr-1.5 h-3.5 w-3.5" /> Product ID: <span className="font-mono ml-1 text-slate-400">{product.id}</span>
          </p>
        </div>
        <Button onClick={() => router.push(`/admin/products/${product.id}/edit`)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md">
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Image Gallery Column (Left, 2 cols) */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden flex flex-col justify-start min-h-[350px]">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
            <ImageIcon className="mr-2 h-5 w-5 text-indigo-400" />
            Product Images
          </h2>
          {product.images && product.images.length > 0 ? (
            <div className="space-y-4 w-full">
              <div className="aspect-square rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                <img src={product.images[activeImageIdx]} alt={product.name} className="h-full w-full object-cover" />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`aspect-square rounded-md overflow-hidden border transition-all ${
                        activeImageIdx === idx ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="Thumbnail" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 border border-dashed border-slate-850 rounded-lg flex flex-col items-center justify-center p-8 text-slate-500 min-h-[250px]">
              <ImageIcon className="h-10 w-10 mb-2 stroke-[1.5]" />
              <span className="text-sm">No images uploaded</span>
            </div>
          )}
        </div>

        {/* Details & Metadata Column (Right, 3 cols) */}
        <div className="md:col-span-3 space-y-6">
          {/* Product Details Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h2 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
              <Tag className="mr-2 h-5 w-5 text-indigo-400" />
              Product Specifications
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {product.description || <span className="italic text-slate-600">No description provided</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center">
                    <Tag className="mr-1.5 h-3.5 w-3.5" /> Price
                  </p>
                  <p className="text-xl font-semibold text-emerald-400">Rp {product.price.toLocaleString("id-ID")}</p>
                </div>
                
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center">
                    <Layers className="mr-1.5 h-3.5 w-3.5" /> Current Stock
                  </p>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${
                      product.stock === 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : 
                      product.stock <= 10 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {product.stock} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History & Metadata Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-24 bg-violet-500/5 rounded-full blur-3xl -mr-12 -mb-12 pointer-events-none"></div>
            <h2 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-violet-400" />
              History & Metadata
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Created At</p>
                    <p className="text-xs text-slate-500">When the product was added</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300 font-medium">
                    {new Date(product.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(product.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between pb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Last Updated</p>
                    <p className="text-xs text-slate-500">When details were modified</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300 font-medium">
                    {new Date(product.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(product.updatedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
