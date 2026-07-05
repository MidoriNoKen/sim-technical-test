"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Package, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const chartData = [
  { name: "Mon", revenue: 2400 },
  { name: "Tue", revenue: 1398 },
  { name: "Wed", revenue: 9800 },
  { name: "Thu", revenue: 3908 },
  { name: "Fri", revenue: 4800 },
  { name: "Sat", revenue: 3800 },
  { name: "Sun", revenue: 4300 },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back, here's what's happening today.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md hover:bg-slate-900/50 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">Rp 45.231.890</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md hover:bg-slate-900/50 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Orders</CardTitle>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">+2350</div>
            <p className="text-xs text-slate-500 mt-1">
              +180 since last hour
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md hover:bg-slate-900/50 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">New Customers</CardTitle>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">+12,234</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-md hover:bg-slate-900/50 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Bounce Rate</CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">2.1%</div>
            <p className="text-xs text-rose-400 flex items-center mt-1">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              +1.2% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-800 bg-slate-900/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-slate-200">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `Rp ${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-slate-800 bg-slate-900/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-slate-200">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "Rp 1.999.000", avatar: "OM" },
                { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "Rp 3.500.000", avatar: "JL" },
                { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "Rp 2.999.000", avatar: "IN" },
                { name: "William Kim", email: "will@email.com", amount: "Rp 990.000", avatar: "WK" },
                { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "Rp 1.499.000", avatar: "SD" }
              ].map((sale, i) => (
                <div key={i} className="flex items-center group cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300 ring-2 ring-slate-800/50 group-hover:ring-indigo-500/50 transition-all">
                    {sale.avatar}
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-200 group-hover:text-indigo-400 transition-colors">{sale.name}</p>
                    <p className="text-sm text-slate-500">{sale.email}</p>
                  </div>
                  <div className="ml-auto font-medium text-emerald-400 group-hover:text-emerald-300">{sale.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
