import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listNotifications } from "@/lib/api/notifications";
import { NotificationsView } from "./NotificationsView";

export default async function NotificationsPage() {
  const initialAll = await listNotifications(serverApiFetch, {});

  return <NotificationsView initialAll={initialAll} />;
}
