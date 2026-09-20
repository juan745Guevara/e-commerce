import Link from "next/link";
import { catalogApi, CATALOG_REVALIDATE_SECONDS } from "@/lib/api/server";
import { ProductCard } from "@/components/product-card";

export const revalidate = 120;

export default async function HomePage() {
  const products = await catalogApi
    .listProducts({}, CATALOG_REVALIDATE_SECONDS)
    .catch(() => []);

  return (
    <div className="flex flex-col gap-10">
      <section className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-rust">Tienda</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight">
          Piezas seleccionadas para el día a día.
        </h1>
        <p className="mt-4 text-lg text-ink/70">
          Catálogo con renderizado estático y revalidación periódica para SEO.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream"
        >
          Ver catálogo
        </Link>
      </section>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
