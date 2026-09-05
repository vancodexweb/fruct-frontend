import { useMutation } from "@tanstack/react-query";
import type { CreateManualDeliveryQuoteDto, DeliveryCalcQuote, DeliveryCalcRequestDto, DeliveryCalcResponse } from "@/types/delivery";
import { clientApiFetch } from "./client-fetcher";

/** Both delivery-calc endpoints are mutations, not queries: `quote` has side effects (persists DeliveryQuote rows, calls DeepSeek) and depends on form input, not a stable cache key. */

function quoteDelivery(dto: DeliveryCalcRequestDto): Promise<DeliveryCalcResponse> {
  return clientApiFetch<DeliveryCalcResponse>("/delivery-calc/quote", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

function createManualDeliveryQuote(dto: CreateManualDeliveryQuoteDto): Promise<DeliveryCalcQuote> {
  return clientApiFetch<DeliveryCalcQuote>("/delivery-calc/manual-quote", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function useQuoteDelivery() {
  return useMutation({ mutationFn: quoteDelivery });
}

export function useCreateManualDeliveryQuote() {
  return useMutation({ mutationFn: createManualDeliveryQuote });
}
