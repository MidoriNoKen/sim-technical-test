"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MoreHorizontal, Plus, Search, Eye, Loader2, Package, DollarSign, ShoppingCart, Users, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
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

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [actionLoading, setActionLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const page = parseInt(searchParams.get("page") || "1", 10)
  const search = searchParams.get("search") || ""

  async function handleUpdateStatus(orderId: string, status: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update status")
        return
      }

      toast.success("Order status updated successfully")
      setOrders(prev => prev.map(o => o.id === orderId ? data.data : o))
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteOrder() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/orders/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete order")
        return
      }

      toast.success("Order deleted successfully")
      setOrders(prev => prev.filter(o => o.id !== deleteId))
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchOrders() {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", "10")
        if (search) params.set("search", search)

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
          setLoading(false)
          return
        }

        setOrders(data.data || [])
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

    fetchOrders()

    return () => {
      cancelled = true
    }
  }, [page, search, router])

  function navigate(pageNum: number, searchTerm?: string) {
    const params = new URLSearchParams()
    params.set("page", pageNum.toString())
    const q = searchTerm !== undefined ? searchTerm : search
    if (q) params.set("search", q)
    router.push(`/admin/orders?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get("search") as string
    navigate(1, q)
  }

  // Compute local stats
  const totalOrdersCount = pagination?.total || orders.length
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
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-48">
                <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                
                {order.status === "PENDING" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(order.id, "VERIFIED")}
                      className="text-blue-400 focus:text-blue-300 focus:bg-blue-950/30 cursor-pointer font-medium"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Verify Order
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                      className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/30 cursor-pointer font-medium"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}

                {order.status === "VERIFIED" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                      className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-950/30 cursor-pointer font-medium"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Complete Order
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                      className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/30 cursor-pointer font-medium"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem
                  onClick={() => setDeleteId(order.id)}
                  className="text-slate-400 focus:text-slate-200 focus:bg-slate-800/40 cursor-pointer font-medium"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
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
          <span className="text-[10px] text-slate-500">Value of current page orders</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Items Sold</p>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{totalItemsSold}</p>
          <span className="text-[10px] text-slate-500">Units on current page</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Customers</p>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{uniqueCustomers}</p>
          <span className="text-[10px] text-slate-500">Unique on current page</span>
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
              placeholder="Search by order ID or customer email..."
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
            {loading ? (
              <TableRow className="hover:bg-slate-800/10 transition-colors">
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500">Loading orders...</span>
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
              <TableRow className="hover:bg-slate-800/10 transition-colors">
                <TableCell colSpan={columns.length} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-slate-600" />
                    <span>No orders matched your search.</span>
                  </div>
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
            Page <span className="text-slate-300 font-semibold">{page}</span> of{" "}
            <span className="text-slate-300 font-semibold">{pagination.totalPages}</span>
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
              This action cannot be undone. This will permanently delete the order
              and restock the products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-slate-800 bg-transparent hover:bg-slate-800 text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteOrder()
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