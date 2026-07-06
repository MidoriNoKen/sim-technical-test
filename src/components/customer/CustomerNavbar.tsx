"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, User, LogOut, FileText } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { UserProfileMenu } from "@/components/shared/UserProfileMenu";

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

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/orders" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 text-slate-300 hover:text-slate-200 hover:bg-slate-800 flex transition-all duration-200" })}>
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">My Orders</span>
          </Link>

          <Link href="/cart" className={buttonVariants({ variant: "outline", size: "sm", className: "relative h-9 border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-300 hover:text-slate-200 transition-all duration-200" })}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950">
                {itemCount}
              </span>
            )}
          </Link>

          <UserProfileMenu role="CUSTOMER" onLogout={handleLogout} />
        </div>
      </div>
    </nav>
  );
}
