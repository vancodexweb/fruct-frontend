import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { CreateUserDto, UpdateOwnProfileDto, UpdateUserDto, User } from "@/types/users";
import { clientApiFetch } from "./client-fetcher";
import type { Fetcher } from "./core";

export const usersKeys = {
  me: () => ["users", "me"] as const,
  managers: () => ["users", "managers"] as const,
};

export function getMe(fetcher: Fetcher): Promise<User> {
  return fetcher<User>("/users/me");
}

export function listManagers(fetcher: Fetcher): Promise<User[]> {
  return fetcher<User[]>("/users");
}

function updateOwnProfile(dto: UpdateOwnProfileDto): Promise<User> {
  return clientApiFetch<User>("/users/me", { method: "PATCH", body: JSON.stringify(dto) });
}

function createManager(dto: CreateUserDto): Promise<User> {
  return clientApiFetch<User>("/users", { method: "POST", body: JSON.stringify(dto) });
}

function updateManager(id: string, dto: UpdateUserDto): Promise<User> {
  return clientApiFetch<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function blockManager(id: string): Promise<User> {
  return clientApiFetch<User>(`/users/${id}/block`, { method: "PATCH" });
}

function unblockManager(id: string): Promise<User> {
  return clientApiFetch<User>(`/users/${id}/unblock`, { method: "PATCH" });
}

function deleteManager(id: string): Promise<void> {
  return clientApiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

export function useMeQuery(options?: { initialData?: User }): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: usersKeys.me(),
    queryFn: () => getMe(clientApiFetch),
    initialData: options?.initialData,
    staleTime: 60_000,
  });
}

export function useManagersQuery(options?: { initialData?: User[] }): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: usersKeys.managers(),
    queryFn: () => listManagers(clientApiFetch),
    initialData: options?.initialData,
    staleTime: 60_000,
  });
}

export function useUpdateOwnProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnProfile,
    onSuccess: (user) => queryClient.setQueryData(usersKeys.me(), user),
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createManager,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersKeys.managers() }),
  });
}

export function useUpdateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => updateManager(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersKeys.managers() }),
  });
}

export function useSetManagerBlocked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      blocked ? blockManager(id) : unblockManager(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersKeys.managers() }),
  });
}

export function useDeleteManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteManager,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usersKeys.managers() }),
  });
}
