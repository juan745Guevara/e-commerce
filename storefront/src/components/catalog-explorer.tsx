"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/api/types";
import { ProductCard } from "./product-card";

export function CatalogExplorer({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !categoryId || product.categoryId === categoryId;
      const matchesQuery =
        !query.trim() ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, categoryId, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
        />
      </div>
      {visible.length === 0 ? (
        <p>No hay productos para mostrar.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
