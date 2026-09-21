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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={
              categoryId === ""
                ? "rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition active:scale-95"
                : "rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-muted transition hover:text-foreground active:scale-95"
            }
          >
            Todo
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={
                categoryId === category.id
                  ? "rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition active:scale-95"
                  : "rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-muted transition hover:text-foreground active:scale-95"
              }
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en Atelier"
            className="w-full rounded-full bg-surface py-2 pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="text-body py-16 text-center">
          No hay productos para mostrar.
        </p>
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
