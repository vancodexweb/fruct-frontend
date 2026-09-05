import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { ChangeDealStatusDto, CreateDealDto, Deal, ListDealsQuery } from "@/types/deals";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";
import { leadsKeys } from "./leads";

export const dealsKeys = {
  all: ["deals"] as const,
  lists: () => [...dealsKeys.all, "list"] as const,
  list: (params?: ListDealsQuery) => [...dealsKeys.lists(), params ?? {}] as const,
  details: () => [...dealsKeys.all, "detail"] as const,
  detail: (id: string) => [...dealsKeys.details(), id] as const,
};

export function listDeals(fetcher: Fetcher, params?: ListDealsQuery): Promise<Deal[]> {
  return fetcher<Deal[]>(`/deals${toQueryString(params as Record<string, unknown>)}`);
}

export function getDeal(fetcher: Fetcher, id: string): Promise<Deal> {
  return fetcher<Deal>(`/deals/${id}`);
}

function createDeal(dto: CreateDealDto): Promise<Deal> {
  return clientApiFetch<Deal>("/deals", { method: "POST", body: JSON.stringify(dto) });
}

function changeDealStatus(id: string, dto: ChangeDealStatusDto): Promise<Deal> {
  return clientApiFetch<Deal>(`/deals/${id}/status`, { method: "PATCH", body: JSON.stringify(dto) });
}

export function useDealsQuery(
  params?: ListDealsQuery,
  options?: { initialData?: Deal[] },
): UseQueryResult<Deal[], Error> {
  return useQuery({
    queryKey: dealsKeys.list(params),
    queryFn: () => listDeals(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 20_000,
  });
}

export function useDealQuery(id: string, options?: { initialData?: Deal }): UseQueryResult<Deal, Error> {
  return useQuery({
    queryKey: dealsKeys.detail(id),
    queryFn: () => getDeal(clientApiFetch, id),
    initialData: options?.initialData,
    staleTime: 20_000,
    enabled: Boolean(id),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeal,
    onSuccess: (deal) => {
      void queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
      // Stock changed (reserved) and the source lead may have a new status implication elsewhere.
      void queryClient.invalidateQueries({ queryKey: leadsKeys.detail(deal.leadId) });
      void queryClient.invalidateQueries({ queryKey: ["catalog", "stock"] });
    },
  });
}

export function useChangeDealStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChangeDealStatusDto) => changeDealStatus(id, dto),
    onSuccess: (deal) => {
      queryClient.setQueryData(dealsKeys.detail(id), deal);
      void queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
      // CANCELLED/REFUNDED restore warehouse stock server-side.
      void queryClient.invalidateQueries({ queryKey: ["catalog", "stock"] });
    },
  });
}
