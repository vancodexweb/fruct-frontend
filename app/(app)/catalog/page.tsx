import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listCategories, listDeliveryOptions, listProducts, listWarehouses } from "@/lib/api/catalog";
import { CatalogView } from "./CatalogView";

export default async function CatalogPage() {
  const [categories, products, warehouses, deliveryOptions] = await Promise.all([
    listCategories(serverApiFetch),
    listProducts(serverApiFetch, {}),
    listWarehouses(serverApiFetch),
    listDeliveryOptions(serverApiFetch),
  ]);

  return (
    <CatalogView
      initialCategories={categories}
      initialProducts={products}
      initialWarehouses={warehouses}
      initialDeliveryOptions={deliveryOptions}
    />
  );
}
