import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { ListNotificationsQuery, Notification } from "@/types/notifications";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (params?: ListNotificationsQuery) => [...notificationsKeys.all, "list", params ?? {}] as const,
};

export function listNotifications(fetcher: Fetcher, params?: ListNotificationsQuery): Promise<Notification[]> {
  return fetcher<Notification[]>(`/notifications${toQueryString(params as Record<string, unknown>)}`);
}

function markNotificationRead(id: string): Promise<Notification> {
  return clientApiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
}

function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  return clientApiFetch<{ updatedCount: number }>("/notifications/read-all", { method: "PATCH" });
}

/** Polled so the unread badge in the top bar stays current without the user refreshing the page. */
export function useNotificationsQuery(
  params?: ListNotificationsQuery,
  options?: { initialData?: Notification[]; refetchInterval?: number },
): UseQueryResult<Notification[], Error> {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => listNotifications(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 15_000,
    refetchInterval: options?.refetchInterval,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  });
}
