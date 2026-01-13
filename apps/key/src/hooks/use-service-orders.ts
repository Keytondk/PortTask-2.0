import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateServiceOrderInput, UpdateServiceOrderInput } from '@/lib/api';
import { portCallKeys } from './use-port-calls';

// Query keys
export const serviceOrderKeys = {
  all: ['service-orders'] as const,
  lists: () => [...serviceOrderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serviceOrderKeys.lists(), filters] as const,
  details: () => [...serviceOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceOrderKeys.details(), id] as const,
};

interface UseServiceOrdersParams {
  page?: number;
  perPage?: number;
  portCallId?: string;
  vendorId?: string;
  status?: string;
  enabled?: boolean;
}

// List service orders
export function useServiceOrders(params: UseServiceOrdersParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: serviceOrderKeys.list(queryParams),
    queryFn: () => api.getServiceOrders({
      page: queryParams.page,
      per_page: queryParams.perPage,
      port_call_id: queryParams.portCallId,
      vendor_id: queryParams.vendorId,
      status: queryParams.status,
    }),
    enabled,
  });
}

// Get single service order
export function useServiceOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: serviceOrderKeys.detail(id),
    queryFn: () => api.getServiceOrder(id),
    enabled: enabled && !!id,
  });
}

// Create service order
export function useCreateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portCallId, input }: { portCallId: string; input: CreateServiceOrderInput }) =>
      api.createServiceOrder(portCallId, input),
    onSuccess: (_, { portCallId }) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: portCallKeys.services(portCallId) });
    },
  });
}

// Update service order
export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceOrderInput }) =>
      api.updateServiceOrder(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
    },
  });
}

// Delete service order
export function useDeleteServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteServiceOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
    },
  });
}

// Confirm service order (assign vendor)
export function useConfirmServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      vendorId,
      quotedPrice,
    }: {
      id: string;
      vendorId: string;
      quotedPrice: number;
    }) => api.confirmServiceOrder(id, vendorId, quotedPrice),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
    },
  });
}

// Complete service order
export function useCompleteServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, finalPrice }: { id: string; finalPrice?: number }) =>
      api.completeServiceOrder(id, finalPrice),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: serviceOrderKeys.lists() });
    },
  });
}
