import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, PortCall, CreatePortCallInput, UpdatePortCallInput } from '@/lib/api';

// Query keys
export const portCallKeys = {
  all: ['port-calls'] as const,
  lists: () => [...portCallKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...portCallKeys.lists(), filters] as const,
  details: () => [...portCallKeys.all, 'detail'] as const,
  detail: (id: string) => [...portCallKeys.details(), id] as const,
  services: (id: string) => [...portCallKeys.detail(id), 'services'] as const,
  timeline: (id: string) => [...portCallKeys.detail(id), 'timeline'] as const,
};

interface UsePortCallsParams {
  page?: number;
  perPage?: number;
  workspaceId?: string;
  vesselId?: string;
  portId?: string;
  status?: string;
  enabled?: boolean;
}

// List port calls
export function usePortCalls(params: UsePortCallsParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: portCallKeys.list(queryParams),
    queryFn: () => api.getPortCalls({
      page: queryParams.page,
      per_page: queryParams.perPage,
      workspace_id: queryParams.workspaceId,
      vessel_id: queryParams.vesselId,
      port_id: queryParams.portId,
      status: queryParams.status,
    }),
    enabled,
  });
}

// Get single port call
export function usePortCall(id: string, enabled = true) {
  return useQuery({
    queryKey: portCallKeys.detail(id),
    queryFn: () => api.getPortCall(id),
    enabled: enabled && !!id,
  });
}

// Get port call services
export function usePortCallServices(portCallId: string, enabled = true) {
  return useQuery({
    queryKey: portCallKeys.services(portCallId),
    queryFn: () => api.getPortCallServices(portCallId),
    enabled: enabled && !!portCallId,
  });
}

// Get port call timeline
export function usePortCallTimeline(portCallId: string, enabled = true) {
  return useQuery({
    queryKey: portCallKeys.timeline(portCallId),
    queryFn: () => api.getPortCallTimeline(portCallId),
    enabled: enabled && !!portCallId,
  });
}

// Create port call
export function useCreatePortCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePortCallInput) => api.createPortCall(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portCallKeys.lists() });
    },
  });
}

// Update port call
export function useUpdatePortCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePortCallInput }) =>
      api.updatePortCall(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: portCallKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: portCallKeys.lists() });
    },
  });
}

// Delete port call
export function useDeletePortCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deletePortCall(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portCallKeys.lists() });
    },
  });
}

// Update port call status
export function useUpdatePortCallStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updatePortCall(id, { status: status as PortCall['status'] }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: portCallKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: portCallKeys.lists() });
    },
  });
}
