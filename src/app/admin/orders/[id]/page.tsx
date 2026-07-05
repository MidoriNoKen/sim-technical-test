"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, Package, User, Calendar, ShoppingCart, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

function OrderDetailContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  async function handleUpdateStatus(status: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
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
      setOrder(data.data)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteOrder() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete order")
        return
      }

      toast.success("Order deleted successfully")
      router.push("/admin/orders")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchOrder() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/orders/${id}`, {
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
          setError(data.message || "Failed to fetch order")
          setLoading(false)
          return
        }

        setOrder(data.data)
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

    fetchOrder()

    return () => {
      cancelled = true
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading order details...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error || "Order not found"}
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/orders")}
          className="border-slate-800 text-slate-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
        </Button>
      </div>
    )
  }

  const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/40 pb-5">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/orders")}
            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Order Details
            </h1>
            <p className="text-sm text-slate-400">
              View complete information and manage this order.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <Button
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-900/20"
            >
              {actionLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Complete Order
            </Button>
          )}
          {order.status !== "CANCELLED" && (
            <Button
              onClick={() => handleUpdateStatus("CANCELLED")}
              disabled={actionLoading}
              variant="outline"
              className="border-rose-900/60 bg-rose-950/10 text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 font-semibold"
            >
              Cancel Order
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button
                disabled={actionLoading}
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-700 font-semibold shadow-md shadow-rose-900/20"
              />
            }>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Order
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-100">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. This will permanently delete this order and restock the products.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-850">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOrder}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Order Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Order Summary */}
        <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/40 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-slate-100 text-lg">Order Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Order ID</span>
                <span className="font-mono text-xs text-indigo-400 font-semibold">
                  #{(order.id as string).split("-")[0].toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                  order.status === "COMPLETED" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : order.status === "CANCELLED"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {order.status || "PENDING"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Items</span>
                <span className="text-slate-200 font-medium">{totalItems} units</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Product Types</span>
                <span className="text-slate-200 font-medium">
                  {order.orderItems.length} types
                </span>
              </div>

              <div className="border-t border-slate-800/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-200">
                    Total Amount
                  </span>
                  <span className="text-xl font-bold text-indigo-400">
                    Rp {order.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Date Info */}
        <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/40 pb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-slate-100 text-lg">Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Customer Email</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">
                  {order.user.email}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-xs text-slate-300">
                  {order.userId.split("-")[0].toUpperCase()}
                </span>
              </div>

              <div className="border-t border-slate-800/60 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Order Date</p>
                    <p className="text-slate-200 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="text-slate-200 font-medium">
                      {new Date(order.updatedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
        <CardHeader className="border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-slate-100 text-lg">Order Items</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Detailed breakdown of products in this order
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800/60 hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium">Product</TableHead>
                <TableHead className="text-slate-400 font-medium text-center">
                  Quantity
                </TableHead>
                <TableHead className="text-slate-400 font-medium text-right">
                  Price
                </TableHead>
                <TableHead className="text-slate-400 font-medium text-right">
                  Subtotal
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-slate-800/60 hover:bg-slate-800/20 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">
                        {item.product.name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ID: {item.productId.split("-")[0].toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-800/40 text-slate-200 font-medium text-sm">
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">
                    Rp {item.priceAtPurchase.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-100">
                    Rp {(item.priceAtPurchase * item.quantity).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Total Row */}
          <div className="border-t border-slate-800/60 p-4 bg-slate-950/30">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-200">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-indigo-400">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading order details...</span>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  )
}