import { getSessionUser } from "@/lib/auth/session.server";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listLeads } from "@/lib/api/leads";
import { listManagers } from "@/lib/api/users";
import { LeadsListView } from "./LeadsListView";

const DEFAULT_LIMIT = 50;

export default async function LeadsPage() {
  const user = await getSessionUser();
  const isOwner = user?.role === "OWNER";

  const [leads, managers] = await Promise.all([
    listLeads(serverApiFetch, { limit: DEFAULT_LIMIT, offset: 0 }),
    isOwner ? listManagers(serverApiFetch) : Promise.resolve([]),
  ]);

  return <LeadsListView initialLeads={leads} managers={managers} isOwner={isOwner} />;
}
