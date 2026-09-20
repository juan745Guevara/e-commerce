import Link from "next/link";
import { catalogApi, CATALOG_REVALIDATE_SECONDS } from "@/lib/api/server";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";

export const revalidate = 120;

const HIGHLIGHTS = [
  {
    title: "Diseño",
    body: "Cada pieza pasa por una selección exigente antes de llegar al catálogo.",
  },
  {
    title: "Envío",
    body: "Seguimiento en tiempo real desde que se confirma el pago.",
  },
  {
    title: "Soporte",
    body: "Un equipo real respondiendo por WhatsApp en cada etapa del pedido.",
  },
];

export default async function HomePage() {
  const products = await catalogApi
    .listProducts({}, CATALOG_REVALIDATE_SECONDS)
    .catch(() => []);

  const featured = products.slice(0, 6);

  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-5 bg-surface px-6 py-24 text-center sm:py-32">
        <p className="text-eyebrow">Nueva temporada</p>
        <h1 className="text-display max-w-3xl text-balance">
          Tecnología pensada para el día a día.
        </h1>
        <p className="text-body max-w-xl text-balance text-lg">
          Un catálogo curado, envíos rastreables y pagos protegidos. Así de
          simple.
        </p>
        <div className="mt-2 flex items-center gap-6">
          <Link href="/catalogo" className="btn-pill">
            Ver catálogo
          </Link>
          <Link href="/catalogo" className="link-chevron">
            Cómo compramos
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
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2">
        {["Explora lo nuevo", "Ofertas de temporada"].map((title, index) => (
          <Link
            key={title}
            href="/catalogo"
            className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl bg-surface p-10"
          >
            <ProductArt
              label={index === 0 ? "laptop" : "audio"}
              className="absolute inset-0 flex items-center justify-center opacity-70 transition duration-500 group-hover:scale-105"
            />
            <div className="relative z-10">
              <h2 className="text-headline text-[1.75rem]">{title}</h2>
            </div>
            <span className="link-chevron relative z-10 text-base">
              Comprar
              <svg
                width="10"
                height="10"
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
          </Link>
        ))}
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20">
          <div className="flex items-end justify-between">
            <h2 className="text-headline text-[1.75rem]">Destacados</h2>
            <Link href="/catalogo" className="link-chevron hidden sm:inline-flex">
              Ver todo
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
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-line bg-surface px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <h3 className="text-title text-lg">{item.title}</h3>
              <p className="text-body">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
