import { CatalogExplorer } from "@/components/catalog-explorer";
import { catalogApi, CATALOG_REVALIDATE_SECONDS } from "@/lib/api/server";

export const revalidate = 120;

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    catalogApi.listCategories(CATALOG_REVALIDATE_SECONDS).catch(() => []),
    catalogApi.listProducts({}, CATALOG_REVALIDATE_SECONDS).catch(() => []),
  ]);

  return (
    <div className="flex flex-col">
      <div className="bg-surface px-6 py-14 text-center">
        <h1 className="text-headline">Catálogo</h1>
        <p className="text-body mx-auto mt-3 max-w-md">
          Actualizado cada {CATALOG_REVALIDATE_SECONDS} segundos.
        </p>
      </div>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <CatalogExplorer products={products} categories={categories} />
      </div>
    </div>
  );
}
