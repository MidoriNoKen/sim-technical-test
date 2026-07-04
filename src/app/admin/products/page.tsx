"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        if (search) params.set("search", search);

        const res = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        });

        if (cancelled) return;

        if (res.status === 401) {
          router.push("/login?redirect=/admin/products");
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to fetch products");
          setLoading(false);
          return;
        }

        setProducts(data.data || []);
        setPagination(data.pagination || null);
      } catch {
        if (!cancelled) {
          setError("Network error. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [page, search, router]);

  function navigate(pageNum: number, searchTerm?: string) {
    const params = new URLSearchParams();
    params.set("page", pageNum.toString());
    const q = searchTerm !== undefined ? searchTerm : search;
    if (q) params.set("search", q);
    router.push(`/admin/products?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("search") as string;
    navigate(1, q);
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Failed to delete product");
        return;
      }

      window.location.reload();
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ color: "#333", fontSize: "1.5rem" }}>Products</h1>
        <a
          href="/admin/products/new"
          style={{
            background: "#0070f3",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          + New Product
        </a>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          name="search"
          defaultValue={search}
          placeholder="Search products..."
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "0.9rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {error && (
        <div style={{ padding: "1rem", background: "#ffe0e0", color: "#c00", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading && (
        <p style={{ color: "#666", textAlign: "center", padding: "2rem" }}>Loading products...</p>
      )}

      {!loading && !error && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "4px", overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Stock</th>
                  <th style={{ ...thStyle, width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}>{product.name}</td>
                      <td style={tdStyle}>{product.description}</td>
                      <td style={tdStyle}>${Number(product.price).toFixed(2)}</td>
                      <td style={tdStyle}>{product.stock}</td>
                      <td style={tdStyle}>
                        <a
                          href={`/admin/products/${product.id}/edit`}
                          style={{
                            background: "#0070f3",
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "4px",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            marginRight: "0.5rem",
                          }}
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          style={{
                            background: "#e00",
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={() => navigate(page - 1, search)}
                disabled={page <= 1}
                style={pageBtnStyle(page <= 1)}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => navigate(p, search)}
                  style={{
                    ...pageBtnStyle(p === page),
                    fontWeight: p === page ? "bold" : "normal",
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => navigate(page + 1, search)}
                disabled={page >= pagination.totalPages}
                style={pageBtnStyle(page >= pagination.totalPages)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p style={{ color: "#666", textAlign: "center", padding: "2rem" }}>Loading...</p>}>
      <ProductsContent />
    </Suspense>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem",
  fontSize: "0.85rem",
  color: "#555",
  borderBottom: "2px solid #ddd",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.9rem",
  color: "#333",
};

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 0.8rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    background: disabled ? "#f5f5f5" : "#fff",
    color: disabled ? "#ccc" : "#333",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.85rem",
  };
}