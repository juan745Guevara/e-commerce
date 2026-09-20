"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";
import { ProductArt } from "./product-art";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface"
    >
      <Link href={`/producto/${product.id}`} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <ProductArt
              label={product.name}
              className="flex h-full w-full items-center justify-center transition duration-500 group-hover:scale-[1.04]"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-5 py-5">
          <h2 className="text-title text-[1.05rem]">{product.name}</h2>
          <p className="line-clamp-2 text-sm text-muted">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <p className="text-[15px] font-medium text-foreground">
              {formatMoney(product.price)}
            </p>
            <span className="link-chevron text-sm">
              Ver
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
