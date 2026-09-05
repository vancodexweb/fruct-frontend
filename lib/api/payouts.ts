import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  ApprovePayoutDto,
  ListPayoutsQuery,
  Payout,
  PayoutPeriodDto,
  PayoutPreview,
  UpdatePayoutDto,
} from "@/types/payouts";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export const payoutsKeys = {
  all: ["payouts"] as const,
  lists: () => [...payoutsKeys.all, "list"] as const,
  list: (params?: ListPayoutsQuery) => [...payoutsKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...payoutsKeys.all, "detail", id] as const,
  preview: (dto: PayoutPeriodDto) => [...payoutsKeys.all, "preview", dto] as const,
};

export function listPayouts(fetcher: Fetcher, params?: ListPayoutsQuery): Promise<Payout[]> {
  return fetcher<Payout[]>(`/payouts${toQueryString(params as Record<string, unknown>)}`);
}

export function getPayout(fetcher: Fetcher, id: string): Promise<Payout> {
  return fetcher<Payout>(`/payouts/${id}`);
}

function previewPayouts(dto: PayoutPeriodDto): Promise<PayoutPreview[]> {
  return clientApiFetch<PayoutPreview[]>(`/payouts/preview${toQueryString(dto as unknown as Record<string, unknown>)}`);
}

function generatePayouts(dto: PayoutPeriodDto): Promise<Payout[]> {
  return clientApiFetch<Payout[]>("/payouts/generate", { method: "POST", body: JSON.stringify(dto) });
}

function sendBulkPayouts(dto: PayoutPeriodDto): Promise<{ queuedCount: number }> {
  return clientApiFetch<{ queuedCount: number }>(
    `/payouts/send-bulk${toQueryString(dto as unknown as Record<string, unknown>)}`,
    { method: "POST" },
  );
}

function updatePayout(id: string, dto: UpdatePayoutDto): Promise<Payout> {
  return clientApiFetch<Payout>(`/payouts/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function approvePayout(id: string, dto: ApprovePayoutDto): Promise<Payout> {
  return clientApiFetch<Payout>(`/payouts/${id}/approve`, { method: "PATCH", body: JSON.stringify(dto) });
}

function payPayout(id: string, dto: ApprovePayoutDto): Promise<Payout> {
  return clientApiFetch<Payout>(`/payouts/${id}/pay`, { method: "PATCH", body: JSON.stringify(dto) });
}

function sendPayoutEmail(id: string): Promise<void> {
  return clientApiFetch<void>(`/payouts/${id}/send-email`, { method: "POST" });
}

export function usePayoutsQuery(
  params?: ListPayoutsQuery,
  options?: { initialData?: Payout[] },
): UseQueryResult<Payout[], Error> {
  return useQuery({
    queryKey: payoutsKeys.list(params),
    queryFn: () => listPayouts(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 30_000,
  });
}

export function usePayoutQuery(
  id: string,
  options?: { initialData?: Payout },
): UseQueryResult<Payout, Error> {
  return useQuery({
    queryKey: payoutsKeys.detail(id),
    queryFn: () => getPayout(clientApiFetch, id),
    initialData: options?.initialData,
    staleTime: 30_000,
    enabled: Boolean(id),
  });
}

/** Preview is read-only and side-effect-free server-side, but it's parameterized by a period the user just picked — a query fits, gated on `enabled` until a period is chosen. */
export function usePayoutsPreviewQuery(dto: PayoutPeriodDto | null): UseQueryResult<PayoutPreview[], Error> {
  return useQuery({
    queryKey: dto ? payoutsKeys.preview(dto) : payoutsKeys.preview({ periodStart: "", periodEnd: "" }),
    queryFn: () => previewPayouts(dto as PayoutPeriodDto),
    enabled: Boolean(dto?.periodStart && dto?.periodEnd),
    staleTime: 0,
  });
}

export function useGeneratePayouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generatePayouts,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() }),
  });
}

export function useSendBulkPayouts() {
  return useMutation({ mutationFn: sendBulkPayouts });
}

export function useUpdatePayout(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePayoutDto) => updatePayout(id, dto),
    onSuccess: (payout) => {
      queryClient.setQueryData(payoutsKeys.detail(id), payout);
      void queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
    },
  });
}

export function useApprovePayout(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ApprovePayoutDto) => approvePayout(id, dto),
    onSuccess: (payout) => {
      queryClient.setQueryData(payoutsKeys.detail(id), payout);
      void queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
    },
  });
}

export function usePayPayout(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ApprovePayoutDto) => payPayout(id, dto),
    onSuccess: (payout) => {
      queryClient.setQueryData(payoutsKeys.detail(id), payout);
      void queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
    },
  });
}

export function useSendPayoutEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendPayoutEmail,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: payoutsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
    },
  });
}
