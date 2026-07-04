"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    // Clear the token cookie by setting it with maxAge=0
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Also clear it client-side by redirecting
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{
        background: "#1a1a2e",
        color: "#fff",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="/admin/products" style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#fff" }}>
            Solutech Admin
          </a>
          <a href="/admin/products" style={{ color: "#ccc", fontSize: "0.9rem" }}>
            Products
          </a>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            color: "#ccc",
            border: "1px solid #555",
            padding: "0.4rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Logout
        </button>
      </nav>
      <main style={{ flex: 1, padding: "1.5rem", background: "#f5f5f5" }}>
        {children}
      </main>
    </div>
  );
}