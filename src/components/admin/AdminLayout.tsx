"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Users, LogOut, Menu, Bell, User, ChevronDown, LayoutDashboard } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products Catalog", href: "/admin/products", icon: Package },
  { name: "Order Tracking", href: "/admin/orders", icon: Users },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      document.cookie = "token=; path=/; max-age=0"
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-850 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none bg-gradient-to-r from-indigo-200 to-slate-200 bg-clip-text text-transparent">
              Solutech
            </h1>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              ADMIN CONTROL
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {sidebarItems.map((item) => {
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : (pathname === item.href || pathname?.startsWith(`${item.href}/`))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Card at bottom of Sidebar */}
        <div className="border-t border-slate-850 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/20 p-3 border border-slate-800/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-200">Admin User</p>
              <p className="truncate text-[10px] text-slate-500">admin@solutech.id</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-slate-800 hover:bg-slate-850 text-slate-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500 font-medium">Overview</p>
              <h2 className="text-sm font-semibold text-slate-200">Management Panel</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 relative"
                />
              }>
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-[5px] right-[7px] h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-800 text-slate-200 p-0 overflow-hidden">
                <div className="bg-slate-800/50 px-4 py-3 font-semibold text-sm border-b border-slate-800">
                  Notifications
                </div>
                <div className="flex flex-col">
                  <div className="px-4 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/50">
                    <p className="text-sm font-medium text-slate-200">New Order #1024</p>
                    <p className="text-xs text-slate-400 mt-0.5">Just now</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors">
                    <p className="text-sm font-medium text-slate-200">Stock Low: USB-C Hub</p>
                    <p className="text-xs text-slate-400 mt-0.5">2 hours ago</p>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-2 text-center border-t border-slate-800">
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Mark all as read</button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" className="gap-2 border-slate-800 hover:bg-slate-850 text-slate-300" />
              }>
                <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                  A
                </div>
                <span className="text-xs font-medium hidden sm:inline">Admin</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-200">Admin User</p>
                    <p className="text-xs leading-none text-slate-500">admin@solutech.id</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem className="cursor-pointer text-slate-300 focus:bg-slate-800 focus:text-slate-200">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950/40">
          {children}
        </main>
      </div>
    </div>
  )
}
