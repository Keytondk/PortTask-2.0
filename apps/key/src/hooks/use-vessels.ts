import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vesselApi, CreateVesselInput, UpdateVesselInput } from '@/lib/api';

// Query keys
export const vesselKeys = {
  all: ['vessels'] as const,
  lists: () => [...vesselKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...vesselKeys.lists(), filters] as const,
  details: () => [...vesselKeys.all, 'detail'] as const,
  detail: (id: string) => [...vesselKeys.details(), id] as const,
  byImo: (imo: string) => [...vesselKeys.all, 'imo', imo] as const,
  positions: () => [...vesselKeys.all, 'positions'] as const,
  fleetPositions: (workspaceId: string) => [...vesselKeys.positions(), 'fleet', workspaceId] as const,
  vesselPosition: (vesselId: string) => [...vesselKeys.positions(), 'vessel', vesselId] as const,
  vesselTrack: (vesselId: string, filters: Record<string, unknown>) =>
    [...vesselKeys.positions(), 'track', vesselId, filters] as const,
};

interface UseVesselsParams {
  page?: number;
  perPage?: number;
  workspaceId?: string;
  flag?: string;
  type?: string;
  enabled?: boolean;
}

// List vessels
export function useVessels(params: UseVesselsParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: vesselKeys.list(queryParams),
    queryFn: () => vesselApi.getVessels({
      page: queryParams.page,
      per_page: queryParams.perPage,
      workspace_id: queryParams.workspaceId,
      flag: queryParams.flag,
      type: queryParams.type,
    }),
    enabled,
  });
}

// Get single vessel
export function useVessel(id: string, enabled = true) {
  return useQuery({
    queryKey: vesselKeys.detail(id),
    queryFn: () => vesselApi.getVessel(id),
    enabled: enabled && !!id,
  });
}

// Get vessel by IMO
export function useVesselByIMO(imo: string, enabled = true) {
  return useQuery({
    queryKey: vesselKeys.byImo(imo),
    queryFn: () => vesselApi.getVesselByIMO(imo),
    enabled: enabled && !!imo,
  });
}

// Create vessel
export function useCreateVessel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVesselInput) => vesselApi.createVessel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vesselKeys.lists() });
    },
  });
}

// Update vessel
export function useUpdateVessel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVesselInput }) =>
      vesselApi.updateVessel(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vesselKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vesselKeys.lists() });
    },
  });
}

// Get fleet positions
export function useFleetPositions(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: vesselKeys.fleetPositions(workspaceId),
    queryFn: () => vesselApi.getFleetPositions(workspaceId),
    enabled: enabled && !!workspaceId,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

// Get vessel position
export function useVesselPosition(vesselId: string, enabled = true) {
  return useQuery({
    queryKey: vesselKeys.vesselPosition(vesselId),
    queryFn: () => vesselApi.getVesselPosition(vesselId),
    enabled: enabled && !!vesselId,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

// Get vessel track (history)
export function useVesselTrack(
  vesselId: string,
  params: { from?: string; to?: string; limit?: number } = {},
  enabled = true
) {
  return useQuery({
    queryKey: vesselKeys.vesselTrack(vesselId, params),
    queryFn: () => vesselApi.getVesselTrack(vesselId, params),
    enabled: enabled && !!vesselId,
  });
}

// Refresh fleet positions
export function useRefreshPositions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => vesselApi.refreshPositions(workspaceId),
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: vesselKeys.fleetPositions(workspaceId) });
    },
  });
}
