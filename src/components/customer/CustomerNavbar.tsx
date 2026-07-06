"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, User, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CustomerNavbar() {
  const router = useRouter();
  const { itemCount } = useCart();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-200 to-slate-200 bg-clip-text text-transparent">
            Solutech Store
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800 hidden sm:flex">
            <Link href="/orders">
              <FileText className="h-4 w-4 mr-2" />
              My Orders
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="relative border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9">
                <User className="h-4 w-4" />
                <span className="sr-only">User Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-100">My Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-800 focus:text-slate-100 sm:hidden">
                <Link href="/orders">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-red-950/50 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
