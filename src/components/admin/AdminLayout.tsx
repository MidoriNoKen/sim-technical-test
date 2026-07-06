"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Users, LogOut, Menu, Bell, User, ChevronDown, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserProfileMenu } from "@/components/shared/UserProfileMenu"
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
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-compact")
    if (stored === "true") {
      setTimeout(() => {
        setIsCompact(true)
      }, 0)
    }
  }, [])

  const toggleCompact = () => {
    const nextVal = !isCompact
    setIsCompact(nextVal)
    localStorage.setItem("sidebar-compact", String(nextVal))
  }

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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
          isCompact ? "w-64 md:w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          "flex h-16 items-center border-b border-slate-850 px-4 transition-all duration-300",
          isCompact ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Package className="h-5 w-5" />
            </div>
            {!isCompact && (
              <div className="animate-in fade-in duration-200">
                <h1 className="font-bold text-sm leading-none bg-gradient-to-r from-indigo-200 to-slate-200 bg-clip-text text-transparent">
                  Solutech
                </h1>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  ADMIN CONTROL
                </span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-7 w-7 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={toggleCompact}
          >
            {isCompact ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                title={isCompact ? item.name : undefined}
                className={cn(
                  "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isCompact ? "md:justify-center md:px-0 md:h-11 md:w-11 md:mx-auto gap-0" : "gap-3.5",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110 shrink-0",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200",
                    isCompact ? "md:mr-0" : ""
                  )}
                />
                <span className={cn(
                  "transition-all duration-200",
                  isCompact ? "md:hidden" : ""
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User Card at bottom of Sidebar */}
        <div className="border-t border-slate-850 p-4 flex flex-col gap-2 items-center">
          {isCompact ? (
            <>
              <div className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20" title="Admin User (admin@solutech.id)">
                A
              </div>
              <button
                onClick={handleLogout}
                className="hidden md:flex rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
              
              {/* Show full detail user card on mobile overlay even if desktop compact is true */}
              <div className="flex md:hidden items-center gap-3 rounded-xl bg-slate-800/20 p-3 border border-slate-800/40 w-full">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
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
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/20 p-3 border border-slate-800/40 w-full">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
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
          )}
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
              <DropdownMenuTrigger className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "rounded-full h-9 w-9 border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 relative transition-all duration-200"
              )}>
                <Bell className="h-4 w-4" />
                <span className="absolute top-[6px] right-[8px] h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse" />
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
            <UserProfileMenu role="ADMIN" onLogout={handleLogout} />
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
