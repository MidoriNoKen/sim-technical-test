"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`, {
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
          setError(data.message || "Failed to fetch product");
          setFetching(false);
          return;
        }

        const product = data.data;
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          stock: product.stock?.toString() || "",
        });
      } catch {
        if (!cancelled) {
          setError("Network error. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to update product");
        setLoading(false);
        return;
      }

      router.push("/admin/products");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <p style={{ color: "#666", textAlign: "center", padding: "2rem" }}>
        Loading product...
      </p>
    );
  }

  if (error && !formData.name) {
    return (
      <div>
        <div style={{ padding: "1rem", background: "#ffe0e0", color: "#c00", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
        <a href="/admin/products" style={{ color: "#0070f3" }}>Back to products</a>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: "#333", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Edit Product</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "4px",
          maxWidth: "500px",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="name" style={{ display: "block", marginBottom: "0.5rem", color: "#555" }}>
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="description" style={{ display: "block", marginBottom: "0.5rem", color: "#555" }}>
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="price" style={{ display: "block", marginBottom: "0.5rem", color: "#555" }}>
            Price
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="stock" style={{ display: "block", marginBottom: "0.5rem", color: "#555" }}>
            Stock
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              background: loading ? "#999" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/admin/products"
            style={{
              padding: "0.5rem 1rem",
              background: "#f0f0f0",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "0.9rem",
};