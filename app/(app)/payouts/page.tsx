import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listPayouts } from "@/lib/api/payouts";
import { listManagers } from "@/lib/api/users";
import { PayoutsView } from "./PayoutsView";

export default async function PayoutsPage() {
  const [payouts, managers] = await Promise.all([
    listPayouts(serverApiFetch, {}),
    listManagers(serverApiFetch),
  ]);

  return <PayoutsView initialPayouts={payouts} managers={managers} />;
}
