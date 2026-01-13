import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CreateRFQInput, UpdateRFQInput, SubmitQuoteInput } from '@/lib/api';

// Query keys
export const rfqKeys = {
  all: ['rfqs'] as const,
  lists: () => [...rfqKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...rfqKeys.lists(), filters] as const,
  details: () => [...rfqKeys.all, 'detail'] as const,
  detail: (id: string) => [...rfqKeys.details(), id] as const,
  quotes: (rfqId: string) => [...rfqKeys.detail(rfqId), 'quotes'] as const,
  comparison: (rfqId: string) => [...rfqKeys.detail(rfqId), 'comparison'] as const,
};

interface UseRFQsParams {
  page?: number;
  perPage?: number;
  portCallId?: string;
  serviceTypeId?: string;
  status?: string;
  enabled?: boolean;
}

// List RFQs
export function useRFQs(params: UseRFQsParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: rfqKeys.list(queryParams),
    queryFn: () => api.getRFQs({
      page: queryParams.page,
      per_page: queryParams.perPage,
      port_call_id: queryParams.portCallId,
      service_type_id: queryParams.serviceTypeId,
      status: queryParams.status,
    }),
    enabled,
  });
}

// Get single RFQ
export function useRFQ(id: string, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.detail(id),
    queryFn: () => api.getRFQ(id),
    enabled: enabled && !!id,
  });
}

// Get RFQ quotes
export function useRFQQuotes(rfqId: string, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.quotes(rfqId),
    queryFn: () => api.getRFQQuotes(rfqId),
    enabled: enabled && !!rfqId,
  });
}

// Get RFQ quote comparison
export function useRFQComparison(rfqId: string, enabled = true) {
  return useQuery({
    queryKey: rfqKeys.comparison(rfqId),
    queryFn: () => api.compareRFQQuotes(rfqId),
    enabled: enabled && !!rfqId,
  });
}

// Create RFQ
export function useCreateRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRFQInput) => api.createRFQ(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Update RFQ
export function useUpdateRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRFQInput }) =>
      api.updateRFQ(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Publish RFQ
export function usePublishRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.publishRFQ(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Close RFQ
export function useCloseRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.closeRFQ(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Cancel RFQ
export function useCancelRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.cancelRFQ(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Award quote
export function useAwardQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rfqId, quoteId }: { rfqId: string; quoteId: string }) =>
      api.awardQuote(rfqId, quoteId),
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.quotes(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}

// Submit quote (for vendors)
export function useSubmitQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rfqId, input }: { rfqId: string; input: SubmitQuoteInput }) =>
      api.submitQuote(rfqId, input),
    onSuccess: (_, { rfqId }) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.quotes(rfqId) });
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
    },
  });
}
