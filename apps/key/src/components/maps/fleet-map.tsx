'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vesselApi, VesselFull, VesselPosition } from '@/lib/api';
import { VesselMap } from '@/components/vessels/vessel-map';
import { useUser } from '@/stores/authStore';
import {
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Ship,
  MapPin,
  Clock,
  Navigation,
  Loader2,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface FleetMapProps {
  workspaceId?: string;
  className?: string;
}

export function FleetMap({ workspaceId: propWorkspaceId, className }: FleetMapProps) {
  const user = useUser();
  const queryClient = useQueryClient();
  const workspaceId = propWorkspaceId || user?.workspace_id || '';

  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVesselList, setShowVesselList] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Fetch vessels
  const { data: vesselsData, isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels', workspaceId],
    queryFn: () => vesselApi.getVessels({ workspace_id: workspaceId, per_page: 100 }),
    enabled: !!workspaceId,
  });

  // Fetch fleet positions
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ['fleet-positions', workspaceId],
    queryFn: () => vesselApi.getFleetPositions(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch vessel track when vessel is selected
  const { data: trackData } = useQuery({
    queryKey: ['vessel-track', selectedVesselId],
    queryFn: () =>
      vesselApi.getVesselTrack(selectedVesselId!, { limit: 100 }),
    enabled: !!selectedVesselId,
  });

  // Refresh positions mutation
  const refreshMutation = useMutation({
    mutationFn: () => vesselApi.refreshPositions(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-positions', workspaceId] });
    },
  });

  const vessels = vesselsData?.data || [];
  const positions = positionsData?.data || [];

  // Get unique vessel types for filter
  const vesselTypes = [...new Set(vessels.map((v) => v.type))].sort();

  // Filter vessels
  const filteredVessels = vessels.filter((vessel) => {
    const matchesSearch =
      !searchQuery ||
      vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.imo.includes(searchQuery) ||
      vessel.mmsi?.includes(searchQuery);
    const matchesType = !filterType || vessel.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get selected vessel details
  const selectedVessel = selectedVesselId
    ? vessels.find((v) => v.id === selectedVesselId)
    : null;
  const selectedPosition = selectedVesselId
    ? positions.find((p) => p.vessel_id === selectedVesselId) ||
      selectedVessel?.current_position
    : null;

  const handleVesselSelect = useCallback((vesselId: string) => {
    setSelectedVesselId((prev) => (prev === vesselId ? null : vesselId));
  }, []);

  const isLoading = vesselsLoading || positionsLoading;

  return (
    <div className={clsx('flex h-full', className)}>
      {/* Vessel List Panel */}
      {showVesselList && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Fleet
              </h2>
              <button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh positions"
              >
                <RefreshCw
                  className={clsx(
                    'w-4 h-4 text-slate-600 dark:text-slate-400',
                    refreshMutation.isPending && 'animate-spin'
                  )}
                />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vessels..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All types</option>
                {vesselTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vessel List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredVessels.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Ship className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No vessels found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredVessels.map((vessel) => {
                  const position =
                    positions.find((p) => p.vessel_id === vessel.id) ||
                    vessel.current_position;
                  const isSelected = selectedVesselId === vessel.id;

                  return (
                    <button
                      key={vessel.id}
                      onClick={() => handleVesselSelect(vessel.id)}
                      className={clsx(
                        'w-full p-4 text-left transition-colors',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3
                            className={clsx(
                              'font-medium truncate',
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-900 dark:text-white'
                            )}
                          >
                            {vessel.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            IMO: {vessel.imo} | {vessel.type}
                          </p>
                          {position && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {position.speed?.toFixed(1) || '0'} kn
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(position.recorded_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight
                          className={clsx(
                            'w-5 h-5 flex-shrink-0 transition-transform',
                            isSelected
                              ? 'text-blue-600 rotate-90'
                              : 'text-slate-400'
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Total Vessels</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {vessels.length}
                </p>
              </div>
              <div>
                <p className="text-slate-500">With Position</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {positions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {/* Toggle vessel list button */}
        <button
          onClick={() => setShowVesselList(!showVesselList)}
          className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {showVesselList ? (
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          ) : (
            <Ship className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          )}
        </button>

        <VesselMap
          vessels={filteredVessels}
          positions={positions}
          selectedVesselId={selectedVesselId || undefined}
          onVesselSelect={handleVesselSelect}
          showTrack={!!selectedVesselId}
          trackData={trackData?.data || []}
          className="w-full h-full"
        />

        {/* Selected Vessel Detail Panel */}
        {selectedVessel && selectedPosition && (
          <div className="absolute bottom-4 right-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {selectedVessel.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedVessel.type} | {selectedVessel.flag}
                </p>
              </div>
              <button
                onClick={() => setSelectedVesselId(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">IMO</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedVessel.imo}
                </p>
              </div>
              <div>
                <p className="text-slate-500">MMSI</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedVessel.mmsi || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Position</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedPosition.latitude.toFixed(4)},{' '}
                  {selectedPosition.longitude.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Speed</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedPosition.speed?.toFixed(1) || '0'} kn
                </p>
              </div>
              <div>
                <p className="text-slate-500">Heading</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedPosition.heading?.toFixed(0) || 'N/A'}°
                </p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedPosition.nav_status || 'Unknown'}
                </p>
              </div>
              {selectedPosition.destination && (
                <div className="col-span-2">
                  <p className="text-slate-500">Destination</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedPosition.destination}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">
                Last updated:{' '}
                {formatDistanceToNow(new Date(selectedPosition.recorded_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
