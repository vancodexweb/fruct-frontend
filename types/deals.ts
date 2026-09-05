import type { DecimalString, ListQuery } from "./common";

export type DealStatus =
  | "NEW"
  | "WAITING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export const DEAL_STATUSES: DealStatus[] = [
  "NEW",
  "WAITING_PAYMENT",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

/** Mirrors src/deals/deal-status-transitions.ts on the backend — used to only offer valid next statuses. */
export const DEAL_STATUS_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  NEW: ["WAITING_PAYMENT", "CANCELLED"],
  WAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["COMPLETED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "INSTALLMENT";

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "INSTALLMENT"];

export interface DealItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: DecimalString;
  subtotal: DecimalString;
}

export interface Deal {
  id: string;
  leadId: string;
  managerId: string;
  warehouseId: string | null;
  deliveryOptionId: string | null;
  deliveryQuoteId: string | null;
  deliveryCost: DecimalString;
  discount: DecimalString;
  requiresVatInvoice: boolean;
  legalEntityMarkup: DecimalString;
  totalAmount: DecimalString;
  paymentMethod: PaymentMethod | null;
  status: DealStatus;
  commissionPercentSnap: DecimalString;
  commissionAmount: DecimalString;
  items: DealItem[];
  createdAt: string;
  closedAt: string | null;
}

export interface CreateDealItemDto {
  productId: string;
  quantity: number;
}

export interface CreateDealDto {
  leadId: string;
  warehouseId: string;
  items: CreateDealItemDto[];
  /** Rubles, not percent — server caps this for MANAGER at their own maxDiscountPercent of the goods subtotal. */
  discount?: number;
  requiresVatInvoice?: boolean;
  paymentMethod?: PaymentMethod;
  /** At most one of deliveryOptionId / deliveryQuoteId / deliveryCost. */
  deliveryOptionId?: string;
  deliveryQuoteId?: string;
  deliveryCost?: number;
}

export interface ChangeDealStatusDto {
  status: DealStatus;
}

export interface ListDealsQuery extends ListQuery {
  status?: DealStatus;
  managerId?: string;
  leadId?: string;
}
