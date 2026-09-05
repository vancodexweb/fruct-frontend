import { serverApiFetch } from "@/lib/api/server-fetcher";
import {
  getFunnel,
  getManagersComparison,
  getPurchaseDistribution,
  getRevenue,
  getSlaMetrics,
  getTopProducts,
} from "@/lib/api/analytics";
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
  const period = last30DaysRange();

  const [funnel, sla, revenue, topProducts, managers, purchaseDistribution] = await Promise.all([
    getFunnel(serverApiFetch, period),
    getSlaMetrics(serverApiFetch, period),
    getRevenue(serverApiFetch, { ...period, groupBy: "day" }),
    getTopProducts(serverApiFetch, { ...period, limit: DEFAULT_TOP_PRODUCTS_LIMIT }),
    getManagersComparison(serverApiFetch, period),
    getPurchaseDistribution(serverApiFetch, period),
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
