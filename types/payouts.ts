import type { DecimalString } from "./common";

export type PayoutStatus = "DRAFT" | "APPROVED" | "PAID";

export const PAYOUT_STATUSES: PayoutStatus[] = ["DRAFT", "APPROVED", "PAID"];

export interface Payout {
  id: string;
  managerId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: DecimalString;
  totalCommission: DecimalString;
  totalPayout: DecimalString;
  status: PayoutStatus;
  emailSentAt: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface PayoutPeriodDto {
  periodStart: string;
  periodEnd: string;
  managerId?: string;
}

export interface PayoutPreviewDeal {
  dealId: string;
  createdAt: string;
  totalAmount: DecimalString;
  commissionAmount: DecimalString;
}

/** Not persisted — result of GET /payouts/preview. */
export interface PayoutPreview {
  managerId: string;
  managerFullName: string;
  baseSalary: DecimalString;
  totalCommission: DecimalString;
  totalPayout: DecimalString;
  deals: PayoutPreviewDeal[];
}

export interface UpdatePayoutDto {
  baseSalary?: number;
  totalCommission?: number;
  totalPayout?: number;
}

export interface ApprovePayoutDto {
  notifyManager?: boolean;
}

export interface ListPayoutsQuery {
  status?: PayoutStatus;
  managerId?: string;
}
