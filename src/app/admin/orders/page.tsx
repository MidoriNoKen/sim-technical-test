"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MoreHorizontal, Plus, Search, Eye, Loader2, Package, DollarSign, ShoppingCart, Users } from "lucide-react"
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

interface OrderItem {
  id: string
  productId: string
  quantity: number
  priceAtPurchase: number
  product: {
    name: string
    price: number
  }
}

interface Order {
  id: string
  userId: string
  totalAmount: number
  status: string
  createdAt: string
  updatedAt: string
  user: {
    email: string
  }
  orderItems: OrderItem[]
}


function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const minAmount = searchParams.get("minAmount") ? Number(searchParams.get("minAmount")) : null
  const maxAmount = searchParams.get("maxAmount") ? Number(searchParams.get("maxAmount")) : null
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  const [orders, setOrders] = useState<Order[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)

  // Sync state with search params: reset page & orders when parameters change
  const currentParamsString = searchParams.toString()
  const [prevParamsString, setPrevParamsString] = useState(currentParamsString)
  if (currentParamsString !== prevParamsString) {
    setPrevParamsString(currentParamsString)
    setOrders([])
    setPage(1)
    setHasNextPage(false)
  }

  useEffect(() => {
    let cancelled = false

    async function fetchOrders() {
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
        if (status) params.set("status", status)
        if (minAmount !== null) params.set("minAmount", minAmount.toString())
        if (maxAmount !== null) params.set("maxAmount", maxAmount.toString())
        params.set("sortBy", sortBy)
        params.set("sortOrder", sortOrder)

        const res = await fetch(`/api/orders?${params.toString()}`, {
          credentials: "include",
        })

        if (cancelled) return

        if (res.status === 401) {
          router.push("/login?redirect=/admin/orders")
          return
        }

        const data = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to fetch orders")
          return
        }

        if (page === 1) {
          setOrders(data.data || [])
        } else {
          setOrders((prev) => [...prev, ...(data.data || [])])
        }

        if (data.pagination) {
          setHasNextPage(data.pagination.hasNextPage)
          setTotalCount(data.pagination.total)
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

    fetchOrders()

    return () => {
      cancelled = true
    }
  }, [page, search, status, minAmount, maxAmount, sortBy, sortOrder, router])

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
    const q = formData.get("search") as string
    const stat = formData.get("status") as string
    const minA = formData.get("minAmount") as string
    const maxA = formData.get("maxAmount") as string
    const sortB = formData.get("sortBy") as string
    const sortO = formData.get("sortOrder") as string
    
    const params = new URLSearchParams()
    if (q) params.set("search", q)
    if (stat) params.set("status", stat)
    if (minA) params.set("minAmount", minA)
    if (maxA) params.set("maxAmount", maxA)
    params.set("sortBy", sortB)
    params.set("sortOrder", sortO)

    router.push(`/admin/orders?${params.toString()}`)
  }

  function handleResetFilters() {
    router.push("/admin/orders")
  }

  // Compute local stats
  const totalOrdersCount = totalCount || orders.length
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0)
  const totalItemsSold = orders.reduce(
    (acc, o) => acc + o.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    0
  )
  const uniqueCustomers = new Set(orders.map((o) => o.userId)).size

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-indigo-400 font-semibold">
            #{(row.getValue("id") as string).split("-")[0].toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "user.email",
        header: "Customer",
        cell: ({ row }) => (
          <span className="font-medium text-slate-200 truncate max-w-[160px] block">
            {row.original.user?.email || "N/A"}
          </span>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt)
          return (
            <span className="text-slate-400 text-xs">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )
        },
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const totalItems = row.original.orderItems.reduce(
            (acc, item) => acc + item.quantity,
            0
          )
          return (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-slate-300">{totalItems}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="font-medium text-slate-100">
            Rp {Number(row.getValue("totalAmount")).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = (row.getValue("status") as string) || "PENDING"
          let badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20"
          if (status === "COMPLETED") {
            badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          } else if (status === "VERIFIED") {
            badgeClass = "bg-violet-500/10 text-violet-400 border-violet-500/20"
          } else if (status === "CANCELLED") {
            badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeClass}`}>
              {status}
            </span>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const order = row.original
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
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Order Tracking
          </h1>
          <p className="text-sm text-slate-400">
            Monitor and manage customer orders in real-time.
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/orders/new")}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Orders</p>
            <ShoppingCart className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{totalOrdersCount}</p>
          <span className="text-[10px] text-slate-500">Orders in the system</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Revenue</p>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-slate-500">Value of loaded orders</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Items Sold</p>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{totalItemsSold}</p>
          <span className="text-[10px] text-slate-500">Units loaded</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Customers</p>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{uniqueCustomers}</p>
          <span className="text-[10px] text-slate-500">Unique on loaded pages</span>
        </div>
      </div>

      {/* Advanced Filter UI */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleFilterSubmit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-6 items-end">
          {/* Search */}
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                name="search"
                placeholder="Customer email..."
                defaultValue={search}
                className="pl-9 bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-md border border-slate-800 bg-slate-950/40 py-2 px-3 text-sm text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option className="bg-slate-900 text-slate-200" value="">All Statuses</option>
              <option className="bg-slate-900 text-slate-200" value="PENDING">PENDING</option>
              <option className="bg-slate-900 text-slate-200" value="VERIFIED">VERIFIED</option>
              <option className="bg-slate-900 text-slate-200" value="COMPLETED">COMPLETED</option>
              <option className="bg-slate-900 text-slate-200" value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          
          {/* Min Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Min Amount (Rp)</label>
            <Input
              type="number"
              name="minAmount"
              placeholder="e.g. 50000"
              defaultValue={minAmount || ""}
              className="bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-650 focus-visible:ring-indigo-500"
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Max Amount (Rp)</label>
            <Input
              type="number"
              name="maxAmount"
              placeholder="e.g. 2000000"
              defaultValue={maxAmount || ""}
              className="bg-slate-950/40 border-slate-800 text-slate-200 placeholder:text-slate-650 focus-visible:ring-indigo-500"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Sort By</label>
            <div className="flex gap-2">
              <select
                name="sortBy"
                defaultValue={sortBy}
                className="flex-1 rounded-md border border-slate-800 bg-slate-950/40 py-2 px-3 text-sm text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option className="bg-slate-900 text-slate-200" value="createdAt">Date Created</option>
                <option className="bg-slate-900 text-slate-200" value="totalAmount">Total Amount</option>
              </select>
              <select
                name="sortOrder"
                defaultValue={sortOrder}
                className="w-20 rounded-md border border-slate-800 bg-slate-950/40 py-2 px-1.5 text-xs text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option className="bg-slate-900 text-slate-200" value="desc">Desc</option>
                <option className="bg-slate-900 text-slate-250" value="asc">Asc</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 col-span-1 md:col-span-6 justify-end">
            <Button 
              type="button" 
              onClick={handleResetFilters}
              variant="outline" 
              className="w-24 border-slate-800 bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Reset
            </Button>
            <Button type="submit" className="w-32 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              Apply Filters
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Orders Table */}
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
              <TableRow className="hover:bg-slate-800/10 transition-colors">
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-slate-600" />
                    <span>No orders matched your search.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {loading && page === 1 && (
              <TableRow className="hover:bg-slate-800/10 transition-colors">
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Loading orders...</span>
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
            <span className="text-xs text-slate-500">Loading more orders...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading orders...</span>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}