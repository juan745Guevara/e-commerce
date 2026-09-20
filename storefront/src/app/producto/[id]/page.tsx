import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductArt } from "@/components/product-art";
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
    <article className="flex flex-col">
      <div className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2 md:items-center">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-background">
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
              <ProductArt
                label={product.name}
                className="flex h-full w-full items-center justify-center"
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-eyebrow">Atelier</p>
            <h1 className="text-headline text-[2.5rem]">{product.name}</h1>
            <p className="text-2xl font-medium">{formatMoney(product.price)}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <h2 className="text-title text-lg">Descripción</h2>
          <p className="text-body max-w-2xl">{product.description}</p>
        </div>
        <div className="flex h-fit flex-col gap-4 rounded-3xl bg-surface p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Disponibilidad</span>
            <span
              className={
                product.stock > 0
                  ? "font-medium text-foreground"
                  : "font-medium text-red-600"
              }
            >
              {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
            </span>
          </div>
          <AddToCartButton productId={product.id} disabled={product.stock < 1} />
          <p className="text-xs text-muted">
            Pago protegido · Envío con seguimiento en tiempo real.
          </p>
        </div>
      </div>
    </article>
  );
}
