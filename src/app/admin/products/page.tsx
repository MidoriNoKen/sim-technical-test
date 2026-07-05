"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MoreHorizontal, Plus, Search, Trash, Edit, Loader2, Package, CircleAlert, DollarSign, Layers } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const page = parseInt(searchParams.get("page") || "1", 10)
  const search = searchParams.get("search") || ""

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", "10")
        if (search) params.set("search", search)

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
          setLoading(false)
          return
        }

        setProducts(data.data || [])
        setPagination(data.pagination || null)
      } catch {
        if (!cancelled) {
          setError("Network error. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [page, search, router])

  function navigate(pageNum: number, searchTerm?: string) {
    const params = new URLSearchParams()
    params.set("page", pageNum.toString())
    const q = searchTerm !== undefined ? searchTerm : search
    if (q) params.set("search", q)
    router.push(`/admin/products?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get("search") as string
    navigate(1, q)
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
      
      // Refresh list
      const updatedProducts = products.filter(p => p.id !== deleteId)
      setProducts(updatedProducts)
      
      if (updatedProducts.length === 0 && page > 1) {
        navigate(page - 1, search)
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  // Compute local stats for visual wow factor
  const totalProductsCount = pagination?.total || products.length
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0)
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

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
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40" />
            }>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault()
                  setDeleteId(product.id)
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

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
          <p className="mt-2 text-2xl font-semibold text-slate-100">{totalProductsCount}</p>
          <span className="text-[10px] text-slate-500">Items registered in system</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Page Stock Value</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">Rp {totalValue.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-slate-500">Valuation of current page stock</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Low Stock Warning</p>
            <CircleAlert className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{lowStockCount}</p>
          <span className="text-[10px] text-slate-500">Stock levels between 1 and 10</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Out of Stock</p>
            <Layers className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{outOfStockCount}</p>
          <span className="text-[10px] text-slate-500">Stock completely depleted</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              name="search"
              placeholder="Search by product name..."
              defaultValue={search}
              className="pl-9 bg-slate-900/40 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60">
            Search
          </Button>
        </form>
      </div>

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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Loading catalog...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  No products matched your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(page - 1)}
            disabled={page <= 1}
            className="border-slate-850 bg-slate-900/30 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            Previous
          </Button>
          <div className="text-xs text-slate-500 mx-2">
            Page <span className="text-slate-300 font-semibold">{page}</span> of <span className="text-slate-300 font-semibold">{pagination.totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(page + 1)}
            disabled={page >= pagination.totalPages}
            className="border-slate-850 bg-slate-900/30 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            Next
          </Button>
        </div>
      )}

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