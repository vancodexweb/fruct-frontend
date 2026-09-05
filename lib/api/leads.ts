import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  AssignLeadDto,
  ChangeLeadStatusDto,
  CreateLeadDto,
  Lead,
  ListLeadsQuery,
  UpdateLeadDto,
} from "@/types/leads";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export const leadsKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsKeys.all, "list"] as const,
  list: (params?: ListLeadsQuery) => [...leadsKeys.lists(), params ?? {}] as const,
  details: () => [...leadsKeys.all, "detail"] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
};

// ---- reads (fetcher-injected: same function powers server initialData and client refetch) ----

export function listLeads(fetcher: Fetcher, params?: ListLeadsQuery): Promise<Lead[]> {
  return fetcher<Lead[]>(`/leads${toQueryString(params as Record<string, unknown>)}`);
}

export function getLead(fetcher: Fetcher, id: string): Promise<Lead> {
  return fetcher<Lead>(`/leads/${id}`);
}

// ---- writes (always client-side, per useMutation) ----

function createLead(dto: CreateLeadDto): Promise<Lead> {
  return clientApiFetch<Lead>("/leads", { method: "POST", body: JSON.stringify(dto) });
}

function updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
  return clientApiFetch<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function changeLeadStatus(id: string, dto: ChangeLeadStatusDto): Promise<Lead> {
  return clientApiFetch<Lead>(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify(dto) });
}

function assignLead(id: string, dto: AssignLeadDto): Promise<Lead> {
  return clientApiFetch<Lead>(`/leads/${id}/assign`, { method: "PATCH", body: JSON.stringify(dto) });
}

function deleteLead(id: string): Promise<void> {
  return clientApiFetch<void>(`/leads/${id}`, { method: "DELETE" });
}

// ---- hooks ----

export function useLeadsQuery(
  params?: ListLeadsQuery,
  options?: { initialData?: Lead[] },
): UseQueryResult<Lead[], Error> {
  return useQuery({
    queryKey: leadsKeys.list(params),
    queryFn: () => listLeads(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 20_000,
  });
}

export function useLeadQuery(id: string, options?: { initialData?: Lead }): UseQueryResult<Lead, Error> {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => getLead(clientApiFetch, id),
    initialData: options?.initialData,
    staleTime: 20_000,
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateLeadDto) => updateLead(id, dto),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadsKeys.detail(id), lead);
      void queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useChangeLeadStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ChangeLeadStatusDto) => changeLeadStatus(id, dto),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadsKeys.detail(id), lead);
      void queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useAssignLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AssignLeadDto) => assignLead(id, dto),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadsKeys.detail(id), lead);
      void queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: leadsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}
