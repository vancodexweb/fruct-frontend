import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  FunnelResponse,
  ManagerComparison,
  PeriodQuery,
  PurchaseDistributionResponse,
  RevenueBucket,
  RevenueQuery,
  SlaMetricsResponse,
  TopProduct,
  TopProductsQuery,
} from "@/types/analytics";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export const analyticsKeys = {
  funnel: (q: PeriodQuery) => ["analytics", "funnel", q] as const,
  sla: (q: PeriodQuery) => ["analytics", "sla", q] as const,
  revenue: (q: RevenueQuery) => ["analytics", "revenue", q] as const,
  topProducts: (q: TopProductsQuery) => ["analytics", "top-products", q] as const,
  managersComparison: (q: PeriodQuery) => ["analytics", "managers-comparison", q] as const,
  purchaseDistribution: (q: PeriodQuery) => ["analytics", "purchase-distribution", q] as const,
};

export function getFunnel(fetcher: Fetcher, q: PeriodQuery): Promise<FunnelResponse> {
  return fetcher<FunnelResponse>(`/analytics/funnel${toQueryString(q)}`);
}
export function getSlaMetrics(fetcher: Fetcher, q: PeriodQuery): Promise<SlaMetricsResponse> {
  return fetcher<SlaMetricsResponse>(`/analytics/sla${toQueryString(q)}`);
}
export function getRevenue(fetcher: Fetcher, q: RevenueQuery): Promise<RevenueBucket[]> {
  return fetcher<RevenueBucket[]>(`/analytics/revenue${toQueryString(q)}`);
}
export function getTopProducts(fetcher: Fetcher, q: TopProductsQuery): Promise<TopProduct[]> {
  return fetcher<TopProduct[]>(`/analytics/top-products${toQueryString(q)}`);
}
export function getManagersComparison(fetcher: Fetcher, q: PeriodQuery): Promise<ManagerComparison[]> {
  return fetcher<ManagerComparison[]>(`/analytics/managers-comparison${toQueryString(q)}`);
}
export function getPurchaseDistribution(
  fetcher: Fetcher,
  q: PeriodQuery,
): Promise<PurchaseDistributionResponse> {
  return fetcher<PurchaseDistributionResponse>(`/analytics/purchase-distribution${toQueryString(q)}`);
}

const ANALYTICS_STALE_TIME = 60_000;

export function useFunnelQuery(
  q: PeriodQuery,
  options?: { initialData?: FunnelResponse },
): UseQueryResult<FunnelResponse, Error> {
  return useQuery({
    queryKey: analyticsKeys.funnel(q),
    queryFn: () => getFunnel(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useSlaMetricsQuery(
  q: PeriodQuery,
  options?: { initialData?: SlaMetricsResponse },
): UseQueryResult<SlaMetricsResponse, Error> {
  return useQuery({
    queryKey: analyticsKeys.sla(q),
    queryFn: () => getSlaMetrics(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useRevenueQuery(
  q: RevenueQuery,
  options?: { initialData?: RevenueBucket[] },
): UseQueryResult<RevenueBucket[], Error> {
  return useQuery({
    queryKey: analyticsKeys.revenue(q),
    queryFn: () => getRevenue(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useTopProductsQuery(
  q: TopProductsQuery,
  options?: { initialData?: TopProduct[] },
): UseQueryResult<TopProduct[], Error> {
  return useQuery({
    queryKey: analyticsKeys.topProducts(q),
    queryFn: () => getTopProducts(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useManagersComparisonQuery(
  q: PeriodQuery,
  options?: { initialData?: ManagerComparison[] },
): UseQueryResult<ManagerComparison[], Error> {
  return useQuery({
    queryKey: analyticsKeys.managersComparison(q),
    queryFn: () => getManagersComparison(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function usePurchaseDistributionQuery(
  q: PeriodQuery,
  options?: { initialData?: PurchaseDistributionResponse },
): UseQueryResult<PurchaseDistributionResponse, Error> {
  return useQuery({
    queryKey: analyticsKeys.purchaseDistribution(q),
    queryFn: () => getPurchaseDistribution(clientApiFetch, q),
    initialData: options?.initialData,
    staleTime: ANALYTICS_STALE_TIME,
  });
}
