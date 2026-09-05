import { getSessionUser } from "@/lib/auth/session.server";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listDeals } from "@/lib/api/deals";
import { listManagers } from "@/lib/api/users";
import { DealsListView } from "./DealsListView";

const DEFAULT_LIMIT = 50;

export default async function DealsPage() {
  const user = await getSessionUser();
  const isOwner = user?.role === "OWNER";

  const [deals, managers] = await Promise.all([
    listDeals(serverApiFetch, { limit: DEFAULT_LIMIT, offset: 0 }),
    isOwner ? listManagers(serverApiFetch) : Promise.resolve([]),
  ]);

  return <DealsListView initialDeals={deals} managers={managers} isOwner={isOwner} />;
}
