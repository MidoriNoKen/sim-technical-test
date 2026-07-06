import { ReactNode } from "react";
import { CustomerNavbar } from "@/components/customer/CustomerNavbar";
import { CartProvider } from "@/context/CartContext";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-950 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200">
        <CustomerNavbar />
        <main className="container mx-auto p-4">{children}</main>
      </div>
    </CartProvider>
  );
}
