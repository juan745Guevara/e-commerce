import { CatalogExplorer } from "@/components/catalog-explorer";
import { catalogApi, CATALOG_REVALIDATE_SECONDS } from "@/lib/api/server";

export const revalidate = 120;

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    catalogApi.listCategories(CATALOG_REVALIDATE_SECONDS).catch(() => []),
    catalogApi.listProducts({}, CATALOG_REVALIDATE_SECONDS).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl">Catálogo</h1>
        <p className="mt-2 text-ink/70">
          Actualizado cada {CATALOG_REVALIDATE_SECONDS} segundos (ISR).
        </p>
      </div>
      <CatalogExplorer products={products} categories={categories} />
    </div>
  );
}
