import { getSessionUser } from "@/lib/auth/session.server";
import { serverApiFetch } from "@/lib/api/server-fetcher";
import { listLeads } from "@/lib/api/leads";
import { listDeals } from "@/lib/api/deals";
import { listNotifications } from "@/lib/api/notifications";
import { getFunnel, getSlaMetrics } from "@/lib/api/analytics";
import type { FunnelResponse, SlaMetricsResponse } from "@/types/analytics";
import { toPeriodEndIso } from "@/lib/format/number";
import { DashboardView } from "./DashboardView";

/**
 * `periodEnd` is extended to the end of today (see `toPeriodEndIso`) — the
 * backend treats a bare date as midnight UTC, so without this, today's own
 * leads/deals would silently be excluded from a "last 30 days" summary.
 */
function last30DaysRange(): { periodStart: string; periodEnd: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: toPeriodEndIso(end.toISOString().slice(0, 10)) };
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  const periodRange = last30DaysRange();

  const [leads, deals, notifications] = await Promise.all([
    listLeads(serverApiFetch, { limit: 5 }),
    listDeals(serverApiFetch, { limit: 5 }),
    listNotifications(serverApiFetch, { unreadOnly: true }),
  ]);

  let funnel: FunnelResponse | null = null;
  let sla: SlaMetricsResponse | null = null;
  if (user?.role === "OWNER") {
    [funnel, sla] = await Promise.all([
      getFunnel(serverApiFetch, periodRange),
      getSlaMetrics(serverApiFetch, periodRange),
    ]);
  }

  return (
    <DashboardView
      role={user?.role ?? "MANAGER"}
      initialLeads={leads}
      initialDeals={deals}
      initialNotifications={notifications}
      periodRange={periodRange}
      initialFunnel={funnel}
      initialSla={sla}
    />
  );
}
