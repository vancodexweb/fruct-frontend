import type { DecimalString } from "./common";
import type { LeadStatus } from "./leads";

export interface PeriodQuery {
  periodStart: string;
  periodEnd: string;
}

export interface RevenueQuery extends PeriodQuery {
  groupBy?: "day" | "week" | "month";
}

export interface TopProductsQuery extends PeriodQuery {
  limit?: number;
}

export interface FunnelStage {
  status: LeadStatus;
  count: number;
}

export interface FunnelResponse {
  stages: FunnelStage[];
  totalLeads: number;
  conversionRatePercent: DecimalString;
}

export interface SlaMetricsResponse {
  totalLeads: number;
  respondedCount: number;
  avgResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  slaBreachCount: number;
  slaMinutes: number;
}

export interface RevenueBucket {
  periodStart: string;
  revenue: DecimalString;
  dealsCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: DecimalString;
}

export interface ManagerComparison {
  managerId: string;
  managerFullName: string;
  revenue: DecimalString;
  dealsCount: number;
  leadsAssigned: number;
  leadsWon: number;
  conversionRatePercent: DecimalString;
  avgResponseMinutes: number | null;
}

export interface PurchaseDistributionResponse {
  byHour: number[];
  byDayOfWeek: number[];
}
