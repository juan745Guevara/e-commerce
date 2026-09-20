import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { catalogApi, CATALOG_REVALIDATE_SECONDS } from "@/lib/api/server";
import { formatMoney } from "@/lib/money";

export const revalidate = 120;
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  try {
    const products = await catalogApi.listProducts({}, CATALOG_REVALIDATE_SECONDS);
    return products.map((product) => ({ id: product.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await catalogApi.getProduct(id, CATALOG_REVALIDATE_SECONDS);
    return {
      title: product.name,
      description: product.description,
    };
  } catch {
    return { title: "Producto" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  let product;
  try {
    product = await catalogApi.getProduct(id, CATALOG_REVALIDATE_SECONDS);
  } catch {
    notFound();
  }

  const image = product.images[0];

  return (
    <article className="grid gap-10 md:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-6xl text-ink/20">
            {product.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-4xl">{product.name}</h1>
        <p className="text-xl text-rust">{formatMoney(product.price)}</p>
        <p className="leading-7 text-ink/75">{product.description}</p>
        <p className="text-sm text-ink/50">
          {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
        </p>
        <AddToCartButton productId={product.id} disabled={product.stock < 1} />
      </div>
    </article>
  );
}
