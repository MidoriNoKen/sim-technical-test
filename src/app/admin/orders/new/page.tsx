"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Plus, Trash2, ShoppingCart, Package, DollarSign } from "lucide-react"
import { toast } from "sonner"

import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface OrderItemEntry {
  productId: string
  productName?: string
  price: number
  quantity: number
  maxStock: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([])

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?limit=100", {
          credentials: "include",
        })

        if (cancelled) return

        if (res.status === 401) {
          router.push("/login?redirect=/admin/orders/new")
          return
        }

        const data = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
          toast.error(data.message || "Failed to fetch products")
          return
        }

        setProducts(data.data || [])
      } catch {
        if (!cancelled) {
          toast.error("Network error. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setFetching(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [router])

  function addItem() {
    if (products.length === 0) return

    setOrderItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: undefined,
        price: 0,
        quantity: 1,
        maxStock: 0,
      },
    ])
  }

  function removeItem(index: number) {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity: Math.min(item.quantity, product.stock),
              maxStock: product.stock,
            }
          : item
      )
    )
  }

  function updateQuantity(index: number, quantity: number) {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
          : item
      )
    )
  }

  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  async function handleSubmit() {
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order")
      return
    }

    // Validate all items have selected products
    for (const item of orderItems) {
      if (!item.productId) {
        toast.error("Please select a product for all items")
        return
      }
      if (item.quantity < 1) {
        toast.error(`Invalid quantity for "${item.productName || "item"}"`)
        return
      }
      if (item.quantity > item.maxStock) {
        toast.error(
          `Insufficient stock for "${item.productName}". Available: ${item.maxStock}`
        )
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create order")
        return
      }

      toast.success("Order created successfully")
      router.push(`/admin/orders/${data.data.id}`)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500">Loading products...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
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
            New Order
          </h1>
          <p className="text-sm text-slate-400">
            Create a new customer order by selecting products and quantities.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Order Items Form */}
        <div className="md:col-span-3">
          <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
            <CardHeader className="border-b border-slate-800/40 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-100 text-lg">Order Items</CardTitle>
                  <CardDescription className="text-slate-400">
                    Select products and quantities for this order.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 text-slate-600 mb-3" />
                  <p className="text-sm font-medium">No items added yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Click &quot;Add Item&quot; to start building the order
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={item.productId}
                          onValueChange={(value: string) => updateProduct(index, value)}
                        >
                          <SelectTrigger className="w-full bg-slate-950/40 border-slate-800 text-slate-200 focus:ring-indigo-500">
                            <SelectValue placeholder="Select a product">
                              {item.productName}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            {products.map((product) => (
                              <SelectItem
                                key={product.id}
                                value={product.id}
                                disabled={product.stock === 0}
                                className="focus:bg-slate-800 focus:text-slate-200"
                              >
                                <span className="flex items-center justify-between w-full gap-4">
                                  <span>{product.name}</span>
                                  <span className="text-xs text-slate-500">
                                    {product.stock > 0
                                      ? `Stock: ${product.stock}`
                                      : "Out of stock"}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">
                              Quantity
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(index, parseInt(e.target.value) || 1)
                              }
                              className="bg-slate-950/40 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 h-9"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">
                              Subtotal
                            </label>
                            <div className="h-9 flex items-center text-sm font-medium text-slate-200 bg-slate-950/20 rounded-md px-3 border border-slate-800/50">
                              Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="mt-1 h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-800/40 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => router.push("/admin/orders")}
                    className="border-slate-850 bg-transparent text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/20"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">
            <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
            Order Summary
          </div>

          <Card className="bg-slate-900/40 border-slate-800/60 shadow-xl backdrop-blur-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Items</span>
                  <span className="text-slate-200 font-medium">
                    {orderItems.reduce((acc, item) => acc + item.quantity, 0)} units
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Product Types</span>
                  <span className="text-slate-200 font-medium">
                    {orderItems.length} types
                  </span>
                </div>

                <div className="border-t border-slate-800/60 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-200">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-indigo-400">
                      Rp {totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Quick product list */}
                {orderItems.length > 0 && (
                  <div className="border-t border-slate-800/60 pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Items Breakdown
                    </p>
                    <div className="space-y-2">
                      {orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate">
                              {item.productName}
                            </span>
                          </div>
                          <span className="text-slate-400 shrink-0 ml-2">
                            {item.quantity}x Rp {item.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}