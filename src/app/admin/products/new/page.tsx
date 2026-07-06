"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, Image as ImageIcon, Eye, X, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).default([]),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [imageKeys, setImageKeys] = useState<string[]>([])
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      images: [],
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files);

    if (imageKeys.length + fileList.length > 10) {
      toast.error("You can only upload up to 10 images");
      return;
    }

    setUploading(true);
    for (const file of fileList) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 5MB limit`);
        continue;
      }

      try {
        const res = await fetch("/api/products/images/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(`Failed to initiate upload for "${file.name}"`);
          continue;
        }

        const { uploadUrl, key } = data.data;

        const s3Res = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!s3Res.ok) {
          toast.error(`Failed to upload "${file.name}" to S3`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        setImageKeys((prev) => [...prev, key]);
        setPreviewImages((prev) => [...prev, previewUrl]);
      } catch (error) {
        console.error(error);
        toast.error(`Error uploading file "${file.name}"`);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImageKeys((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Watch fields for live preview
  /* eslint-disable react-hooks/incompatible-library */
  const watchedName = form.watch("name")
  const watchedDescription = form.watch("description")
  const watchedPrice = form.watch("price")
  const watchedStock = form.watch("stock")
  /* eslint-enable react-hooks/incompatible-library */

  async function onSubmit(data: ProductFormValues) {
    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          images: imageKeys,
        }),
      })

      const resData = await res.json()

      if (!res.ok || !resData.success) {
        toast.error(resData.message || "Failed to create product")
        return
      }

      toast.success("Product created successfully")
      router.push("/admin/products")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Stock status styling for live preview
  const previewStockVal = Number(watchedStock) || 0
  let previewStockBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  let previewStockText = `${previewStockVal} In Stock`

  if (previewStockVal === 0) {
    previewStockBadge = "bg-rose-500/10 text-rose-400 border-rose-500/20"
    previewStockText = "Out of Stock"
  } else if (previewStockVal <= 10) {
    previewStockBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20"
    previewStockText = `Low Stock (${previewStockVal})`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/admin/products")} className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            New Product
          </h1>
          <p className="text-sm text-slate-400">Add a new item to your catalog catalog database.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Form Container */}
        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
            <CardHeader className="border-b border-slate-800/40 pb-4 mb-4">
              <CardTitle className="text-slate-100 text-lg">Product Details</CardTitle>
              <CardDescription className="text-slate-400">
                Provide specifications, pricing, and stock details for this item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Wireless Mouse" {...field} className="bg-slate-950/40 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., High performance ergonomic wireless mouse" {...field} className="bg-slate-950/40 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel className="text-slate-300 block">Product Images (Max 10 images, 5MB each)</FormLabel>
                    <div className="grid grid-cols-5 gap-3">
                      {previewImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border border-slate-800 bg-slate-950 overflow-hidden group flex items-center justify-center">
                          {imageErrors[src] ? (
                            <div className="flex flex-col items-center justify-center p-2 text-center text-slate-500">
                              <ImageIcon className="h-6 w-6 mb-1 opacity-60" />
                              <span className="text-[9px] leading-tight text-slate-600">Not Available</span>
                            </div>
                          ) : (
                            <img
                              src={src}
                              alt="Preview"
                              className="h-full w-full object-contain"
                              onError={() => setImageErrors(prev => ({ ...prev, [src]: true }))}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {imageKeys.length < 10 && (
                        <label className="border border-dashed border-slate-850 hover:border-indigo-500/50 bg-slate-950/20 hover:bg-slate-950/40 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-slate-500" />
                              <span className="text-[10px] text-slate-400 mt-1">Upload</span>
                            </>
                          )}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Price (Rp)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" {...field} value={field.value as string | number} className="bg-slate-950/40 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} value={field.value as string | number} className="bg-slate-950/40 border-slate-800 text-slate-200 focus-visible:ring-indigo-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" disabled={loading} onClick={() => router.push("/admin/products")} className="border-slate-850 bg-transparent text-slate-300 hover:bg-slate-800">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/20">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Product
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Card */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            Live Store Preview
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[360px] bg-gradient-to-br from-slate-900 to-indigo-950/20 backdrop-blur-md">
            {/* Geometric Glow Decoration */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

            {/* Media Placeholder */}
            {previewImages.length > 0 ? (
              <div className="h-32 w-full rounded-lg bg-slate-950/60 border border-slate-850 flex items-center justify-center relative overflow-hidden group">
                {imageErrors[previewImages[0]] ? (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="h-6 w-6 mb-1 opacity-60" />
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">Image not available</span>
                  </div>
                ) : (
                  <img
                    src={previewImages[0]}
                    alt="Main Preview"
                    className="h-full w-full object-contain"
                    onError={() => setImageErrors(prev => ({ ...prev, [previewImages[0]]: true }))}
                  />
                )}
              </div>
            ) : (
              <div className="h-32 w-full rounded-lg bg-slate-950/60 border border-slate-850 flex items-center justify-center text-slate-600 select-none relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 opacity-50" />
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <ImageIcon className="h-7 w-7 text-slate-500" />
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">Image Preview</span>
                </div>
              </div>
            )}

            {/* Title & Desc */}
            <div className="space-y-2 mt-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-slate-100 text-lg leading-tight truncate">
                  {watchedName || "Product Title"}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${previewStockBadge} shrink-0`}>
                  {previewStockText}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 h-8">
                {watchedDescription || "Product description will automatically render here..."}
              </p>
            </div>

            {/* Price & Buy Simulation */}
            <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Price</span>
                <span className="text-xl font-bold text-indigo-400">
                  Rp {(Number(watchedPrice) || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <Button type="button" disabled className="bg-slate-800 text-slate-400 border border-slate-700/40 select-none pointer-events-none text-xs h-8 px-4 rounded-lg">
                Buy Item
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}