import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listProducts } from "@/lib/api/catalog";
import { DeliveryCalcView } from "./DeliveryCalcView";

export default async function DeliveryCalcPage() {
  const products = await listProducts(serverApiFetch, {});
  return <DeliveryCalcView initialProducts={products} />;
}
