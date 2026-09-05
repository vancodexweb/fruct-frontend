import type { DecimalString } from "./common";
import type { BuyerType } from "./leads";
import type { DeliveryOption } from "./catalog";

export type DeliveryQuoteSource = "MANUAL" | "AI_ESTIMATE";

export interface DeliveryCalcItemDto {
  productId: string;
  quantity: number;
}

export interface DeliveryCalcRequestDto {
  items: DeliveryCalcItemDto[];
  destinationCity: string;
  buyerType: BuyerType;
  requiresVatInvoice: boolean;
}

export interface DeliveryCalcQuote {
  id: string;
  cost: DecimalString;
  etaDaysMin: number;
  etaDaysMax: number;
  isApproximate: boolean;
  source: DeliveryQuoteSource;
}

export interface DeliveryCalcVariant {
  warehouseId: string;
  warehouseName: string;
  warehouseCity: string;
  isLocal: boolean;
  localDeliveryOptions?: DeliveryOption[];
  quote?: DeliveryCalcQuote;
  quoteUnavailableReason?: string;
}

export interface DeliveryCalcResponse {
  subtotal: DecimalString;
  legalEntityMarkup: DecimalString;
  totalWeightKg: DecimalString;
  variants: DeliveryCalcVariant[];
}

export interface CreateManualDeliveryQuoteDto {
  warehouseId: string;
  destinationCity: string;
  weightKg?: number;
  cost: number;
  etaDaysMin: number;
  etaDaysMax: number;
}
