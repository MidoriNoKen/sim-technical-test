"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, Package, User, Calendar, ShoppingCart, Check, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  priceAtPurchase: number
  product: {
    name: string
    price: number
    description?: string | null
    images?: string[]
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
  verifiedBy?: {
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false)

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
        {/* Action Buttons Dropdown */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                disabled={actionLoading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold shadow-md flex items-center gap-1.5"
              />
            }>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Order"}
              <ChevronDown className="h-4 w-4 opacity-75" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-48">
              <DropdownMenuLabel className="text-slate-400">Order Decisions</DropdownMenuLabel>
              
              {order.status === "PENDING" && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("VERIFIED")}
                    className="text-blue-400 focus:text-blue-300 focus:bg-blue-950/30 cursor-pointer font-medium"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Verify Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("CANCELLED")}
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
                    onClick={() => handleUpdateStatus("COMPLETED")}
                    className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-950/30 cursor-pointer font-medium"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete Order
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("CANCELLED")}
                    className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/30 cursor-pointer font-medium"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Order
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-slate-400 focus:text-slate-200 focus:bg-slate-800/40 cursor-pointer font-medium"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    : order.status === "VERIFIED"
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
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

              {order.verifiedBy && (
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-800/60">
                  <span className="text-slate-400">Verified By (Admin)</span>
                  <span className="text-violet-300 font-medium truncate max-w-[200px]">
                    {order.verifiedBy.email}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-800/60 pt-3 grid grid-cols-2 gap-4">
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

                <div className="flex items-center gap-2 text-sm border-l border-slate-800/65 pl-4">
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
                <TableHead className="text-slate-400 font-medium text-center w-24">
                  Action
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
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsItemDetailsOpen(true);
                      }}
                      className="border-slate-800 hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Detail
                    </Button>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isItemDetailsOpen} onOpenChange={setIsItemDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-[480px]">
          <DialogHeader className="border-b border-slate-800/60 pb-3">
            <DialogTitle className="text-slate-100">Order Item Detail</DialogTitle>
            <DialogDescription className="text-slate-400">
              Details and specifications of this purchased product
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 pt-3">
              {/* Product Image */}
              {selectedItem.product.images && selectedItem.product.images.length > 0 ? (
                <div className="aspect-video w-full rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedItem.product.images[0]}
                    alt={selectedItem.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg border border-dashed border-slate-850 flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-950/20">
                  <ImageIcon className="h-8 w-8 mb-1.5 opacity-40" />
                  <span className="text-xs">No product image available</span>
                </div>
              )}

              {/* Product Name & Description */}
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-slate-100">{selectedItem.product.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Product ID: {selectedItem.productId.toUpperCase()}
                </p>
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-md p-3 mt-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedItem.product.description || "No description provided for this product."}
                  </p>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/20 border border-slate-800/60 rounded-md p-3 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Price</span>
                  <span className="text-sm font-semibold text-slate-200">
                    Rp {selectedItem.priceAtPurchase.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Quantity</span>
                  <span className="text-sm font-semibold text-slate-200">{selectedItem.quantity} qty</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Subtotal</span>
                  <span className="text-sm font-semibold text-indigo-400">
                    Rp {(selectedItem.priceAtPurchase * selectedItem.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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