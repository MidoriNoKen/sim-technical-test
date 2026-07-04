"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create product");
        setLoading(false);
        return;
      }

      router.push("/admin/products");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ color: "#333", fontSize: "1.5rem", marginBottom: "1.5rem" }}>New Product</h1>

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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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
            value={stock}
            onChange={(e) => setStock(e.target.value)}
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
            {loading ? "Creating..." : "Create Product"}
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