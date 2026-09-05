import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { CreateScriptDto, RenderScriptDto, Script, ScriptCategory, UpdateScriptDto } from "@/types/scripts";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export interface ListScriptsQuery {
  category?: ScriptCategory;
  includeInactive?: boolean;
}

export const scriptsKeys = {
  all: ["scripts"] as const,
  list: (params?: ListScriptsQuery) => [...scriptsKeys.all, "list", params ?? {}] as const,
};

export function listScripts(fetcher: Fetcher, params?: ListScriptsQuery): Promise<Script[]> {
  return fetcher<Script[]>(`/scripts${toQueryString(params as Record<string, unknown>)}`);
}

function createScript(dto: CreateScriptDto): Promise<Script> {
  return clientApiFetch<Script>("/scripts", { method: "POST", body: JSON.stringify(dto) });
}

function updateScript(id: string, dto: UpdateScriptDto): Promise<Script> {
  return clientApiFetch<Script>(`/scripts/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function deactivateScript(id: string): Promise<Script> {
  return clientApiFetch<Script>(`/scripts/${id}/deactivate`, { method: "PATCH" });
}

function reactivateScript(id: string): Promise<Script> {
  return clientApiFetch<Script>(`/scripts/${id}/reactivate`, { method: "PATCH" });
}

function renderScript(id: string, dto: RenderScriptDto): Promise<{ rendered: string }> {
  return clientApiFetch<{ rendered: string }>(`/scripts/${id}/render`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function useScriptsQuery(
  params?: ListScriptsQuery,
  options?: { initialData?: Script[] },
): UseQueryResult<Script[], Error> {
  return useQuery({
    queryKey: scriptsKeys.list(params),
    queryFn: () => listScripts(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 5 * 60_000,
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScript,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: scriptsKeys.all }),
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateScriptDto }) => updateScript(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: scriptsKeys.all }),
  });
}

export function useSetScriptActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? reactivateScript(id) : deactivateScript(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: scriptsKeys.all }),
  });
}

export function useRenderScript() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RenderScriptDto }) => renderScript(id, dto),
  });
}
