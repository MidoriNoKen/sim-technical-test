import { prisma } from "@/lib/prisma"
import { Package, Search, ChevronRight, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { email: true }
      },
      orderItems: true
    }
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
            Monitor and track customer orders in real-time.
          </p>
        </div>
      </div>

      {/* Table Section */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <div className="p-4 flex items-center border-b border-slate-800/60 bg-slate-900/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by order ID or customer email..."
              className="pl-9 bg-slate-950/50 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 w-full"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-slate-950/50">
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-slate-400 font-medium">Order ID</TableHead>
              <TableHead className="text-slate-400 font-medium">Customer</TableHead>
              <TableHead className="text-slate-400 font-medium">Date</TableHead>
              <TableHead className="text-slate-400 font-medium">Status</TableHead>
              <TableHead className="text-slate-400 font-medium">Items</TableHead>
              <TableHead className="text-slate-400 font-medium text-right">Total Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow className="border-slate-800/60 hover:bg-slate-800/20">
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0)
                
                return (
                  <TableRow key={order.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors cursor-pointer group">
                    <TableCell className="font-mono text-xs text-indigo-400">
                      {order.id.split("-")[0].toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 truncate max-w-[150px]">
                          {order.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-500" />
                        <span>{totalItems}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-100">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
