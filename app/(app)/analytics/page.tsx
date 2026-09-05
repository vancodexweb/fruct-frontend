import { serverApiFetch } from "@/lib/api/server-fetcher";
import {
  getFunnel,
  getManagersComparison,
  getPurchaseDistribution,
  getRevenue,
  getSlaMetrics,
  getTopProducts,
} from "@/lib/api/analytics";
import { toPeriodEndIso } from "@/lib/format/number";
import { AnalyticsView } from "./AnalyticsView";

const DEFAULT_TOP_PRODUCTS_LIMIT = 10;

/** Mirrors the dashboard's `last30DaysRange()` — kept local so this section stays decoupled from the dashboard file. */
function last30DaysRange(): { periodStart: string; periodEnd: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) };
}

export default async function AnalyticsPage() {
  // Plain "YYYY-MM-DD" — this is what seeds the date <input>s and what
  // AnalyticsView compares against to decide whether the user is still on
  // the default period. Every actual API call below extends periodEnd to
  // the end of that day (see toPeriodEndIso) so today's own activity isn't
  // silently excluded; AnalyticsView does the same adjustment client-side
  // whenever the user applies a new period, so the two stay consistent.
  const period = last30DaysRange();
  const queryPeriod = { periodStart: period.periodStart, periodEnd: toPeriodEndIso(period.periodEnd) };

  const [funnel, sla, revenue, topProducts, managers, purchaseDistribution] = await Promise.all([
    getFunnel(serverApiFetch, queryPeriod),
    getSlaMetrics(serverApiFetch, queryPeriod),
    getRevenue(serverApiFetch, { ...queryPeriod, groupBy: "day" }),
    getTopProducts(serverApiFetch, { ...queryPeriod, limit: DEFAULT_TOP_PRODUCTS_LIMIT }),
    getManagersComparison(serverApiFetch, queryPeriod),
    getPurchaseDistribution(serverApiFetch, queryPeriod),
  ]);

  return (
    <AnalyticsView
      initialPeriod={period}
      initialFunnel={funnel}
      initialSla={sla}
      initialRevenue={revenue}
      initialTopProducts={topProducts}
      initialManagers={managers}
      initialPurchaseDistribution={purchaseDistribution}
    />
  );
}
