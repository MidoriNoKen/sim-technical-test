"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, Eye, Loader2, Package, CircleAlert, DollarSign, Layers, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
}


function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const search = searchParams.get("search") || ""
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  const [localSearch, setLocalSearch] = useState(search)
  const [localMinPrice, setLocalMinPrice] = useState(searchParams.get("minPrice") || "")
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [localSortBy, setLocalSortBy] = useState(sortBy)
  const [localSortOrder, setLocalSortOrder] = useState(sortOrder)

  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "")
    setLocalMinPrice(searchParams.get("minPrice") || "")
    setLocalMaxPrice(searchParams.get("maxPrice") || "")
    setLocalSortBy(searchParams.get("sortBy") || "createdAt")
    setLocalSortOrder(searchParams.get("sortOrder") || "desc")
  }, [searchParams])

  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Sync state with search params: reset page & products when parameters change
  const currentParamsString = searchParams.toString()
  const [prevParamsString, setPrevParamsString] = useState(currentParamsString)
  if (currentParamsString !== prevParamsString) {
    setPrevParamsString(currentParamsString)
    setProducts([])
    setPage(1)
    setHasNextPage(false)
  }

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError("")
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", "10")
        if (search) params.set("search", search)
        if (minPrice !== null) params.set("minPrice", minPrice.toString())
        if (maxPrice !== null) params.set("maxPrice", maxPrice.toString())
        params.set("sortBy", sortBy)
        params.set("sortOrder", sortOrder)

        const res = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        })

        if (cancelled) return

        if (res.status === 401) {
          router.push("/login?redirect=/admin/products")
          return
        }

        const data = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to fetch products")
          return
        }

        if (page === 1) {
          setProducts(data.data || [])
        } else {
          setProducts((prev) => [...prev, ...(data.data || [])])
        }

        if (data.stats) {
          setStats(data.stats)
        }

        if (data.pagination) {
          setHasNextPage(data.pagination.hasNextPage)
        }
      } catch {
        if (!cancelled) {
          setError("Network error. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [page, search, minPrice, maxPrice, sortBy, sortOrder, router, refreshKey])

  const [observerRef, setObserverRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!observerRef || !hasNextPage || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef)
    return () => observer.disconnect()
  }, [observerRef, hasNextPage, loading, loadingMore])

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Start with current URL search params to preserve hidden filters
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1") // reset to page 1 on new filter/search

    const q = formData.get("search")
    if (q !== null) {
      const val = q.toString().trim()
      if (val) params.set("search", val)
      else params.delete("search")
    }

    const minP = formData.get("minPrice")
    if (minP !== null) {
      const val = minP.toString().trim()
      if (val) params.set("minPrice", val)
      else params.delete("minPrice")
    }

    const maxP = formData.get("maxPrice")
    if (maxP !== null) {
      const val = maxP.toString().trim()
      if (val) params.set("maxPrice", val)
      else params.delete("maxPrice")
    }

    const sortB = formData.get("sortBy")
    if (sortB !== null) {
      const val = sortB.toString().trim()
      if (val) params.set("sortBy", val)
    }

    const sortO = formData.get("sortOrder")
    if (sortO !== null) {
      const val = sortO.toString().trim()
      if (val) params.set("sortOrder", val)
    }

    router.push(`/admin/products?${params.toString()}`)
  }

  function handleResetFilters() {
    router.push("/admin/products")
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete product")
        return
      }

      toast.success("Product deleted successfully")
      
      // Refresh list & stats
      setProducts([])
      setPage(1)
      setRefreshKey(prev => prev + 1)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-200">{row.getValue("name")}</span>
      )
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-slate-400 max-w-md block truncate">{row.getValue("description")}</span>
      )
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="font-medium text-slate-200">Rp {Number(row.getValue("price")).toLocaleString("id-ID")}</span>
      )
    },
    {
      accessorKey: "stock",
      header: "Stock Status",
      cell: ({ row }) => {
        const stock = Number(row.getValue("stock"))
        let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        let statusText = `${stock} in stock`

        if (stock === 0) {
          badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20"
          statusText = "Out of Stock"
        } else if (stock <= 10) {
          badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20"
          statusText = `Low Stock (${stock})`
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", stock === 0 ? "bg-rose-400" : stock <= 10 ? "bg-amber-400" : "bg-emerald-400")} />
            {statusText}
          </span>
        )
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/products/${product.id}`)}
            className="text-slate-400 hover:text-indigo-400 hover:bg-slate-800/40 gap-1.5"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        )
      },
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Manage your store items, stock levels, and pricing catalog.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/products/new")} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Products</p>
            <Package className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.totalProducts}</p>
          <span className="text-[10px] text-slate-500">Items registered in system</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Loaded Stock Value</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">Rp {stats.totalStockValue.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-slate-500">Valuation of all database stock</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Low Stock Warning</p>
            <CircleAlert className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.lowStockCount}</p>
          <span className="text-[10px] text-slate-500">Stock levels between 1 and 10</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Out of Stock</p>
            <Layers className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.outOfStockCount}</p>
          <span className="text-[10px] text-slate-500">Stock completely depleted</span>
        </div>
      </div>

      {/* Search & Advanced Filters Form */}
      <form onSubmit={handleFilterSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-550" />
            <Input
              type="search"
              name="search"
              placeholder="Search products by name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-900/40 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500"
            />
          </div>
          <Button type="submit" className="h-10 px-5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white font-semibold shadow-md shadow-indigo-600/10 transition-all duration-200 border-0">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-10 border-slate-800 bg-transparent text-slate-400 hover:text-slate-255 hover:bg-slate-800 gap-2",
              showFilters && "bg-slate-800/80 border-slate-700 text-indigo-400 hover:text-indigo-350"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
              {/* Min Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Min Price (Rp)</label>
                <Input
                  type="number"
                  name="minPrice"
                  placeholder="e.g. 10000"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Max Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Max Price (Rp)</label>
                <Input
                  type="number"
                  name="maxPrice"
                  placeholder="e.g. 500000"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Sort By</label>
                <div className="flex gap-2">
                  <select
                    name="sortBy"
                    value={localSortBy}
                    onChange={(e) => setLocalSortBy(e.target.value)}
                    className="flex-1 rounded-md border border-slate-800 bg-slate-950/40 py-2 px-3 text-sm text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option className="bg-slate-900 text-slate-200" value="createdAt">Date Created</option>
                    <option className="bg-slate-900 text-slate-200" value="name">Product Name</option>
                    <option className="bg-slate-900 text-slate-200" value="price">Price</option>
                    <option className="bg-slate-900 text-slate-200" value="stock">Stock Level</option>
                  </select>
                  <select
                    name="sortOrder"
                    value={localSortOrder}
                    onChange={(e) => setLocalSortOrder(e.target.value)}
                    className="w-20 rounded-md border border-slate-800 bg-slate-950/40 py-2 px-1.5 text-xs text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option className="bg-slate-900 text-slate-200" value="desc">Desc</option>
                    <option className="bg-slate-900 text-slate-250" value="asc">Asc</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={handleResetFilters}
                  variant="outline" 
                  className="w-24 border-slate-800 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Reset
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-slate-900/40 border-b border-slate-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-slate-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-slate-400 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-slate-800 hover:bg-slate-800/10 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !loading ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  No products matched your search.
                </TableCell>
              </TableRow>
            ) : null}

            {loading && page === 1 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Loading catalog...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Loader Spacer */}
      <div ref={setObserverRef} className="h-16 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-indigo-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs text-slate-500">Loading more products...</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the product
              and remove its data from our database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-slate-800 bg-transparent hover:bg-slate-800 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              className="bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading catalog...</span>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}