import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] bg-sand">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-ink/20">
            {product.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-serif text-lg text-ink">{product.name}</h2>
        <p className="line-clamp-2 text-sm text-ink/60">{product.description}</p>
        <p className="mt-auto pt-3 text-sm font-medium text-rust">
          {formatMoney(product.price)}
        </p>
      </div>
    </Link>
  );
}
