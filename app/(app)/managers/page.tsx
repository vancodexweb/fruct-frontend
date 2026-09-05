import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listManagers } from "@/lib/api/users";
import { ManagersView } from "./ManagersView";

export default async function ManagersPage() {
  const managers = await listManagers(serverApiFetch);

  return <ManagersView initialManagers={managers} />;
}
