'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@navo/ui';
import { Ship, Maximize2, Minimize2, Layers, Navigation } from 'lucide-react';

// Types for vessel positions
interface VesselPosition {
  id: string;
  name: string;
  imo: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: 'sailing' | 'anchored' | 'moored' | 'not_available';
  destination?: string;
  eta?: Date;
  lastUpdate: Date;
}

interface VesselMapProps {
  vessels?: VesselPosition[];
  selectedVesselId?: string;
  onVesselSelect?: (vesselId: string) => void;
  height?: string;
  showControls?: boolean;
  center?: [number, number];
  zoom?: number;
}

// Mock vessel positions - would come from AIS data in production
const mockVessels: VesselPosition[] = [
  {
    id: '1',
    name: 'MV Pacific Star',
    imo: '9876543',
    lat: 1.2644,
    lng: 103.8198,
    heading: 45,
    speed: 12.5,
    status: 'sailing',
    destination: 'Singapore',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    lastUpdate: new Date(),
  },
  {
    id: '2',
    name: 'MV Atlantic Voyager',
    imo: '9876544',
    lat: 51.9074,
    lng: 4.4884,
    heading: 180,
    speed: 0,
    status: 'moored',
    destination: 'Rotterdam',
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'MV Global Pioneer',
    imo: '9876545',
    lat: 29.7604,
    lng: -95.3698,
    heading: 270,
    speed: 8.2,
    status: 'sailing',
    destination: 'Houston',
    eta: new Date(Date.now() + 12 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '4',
    name: 'MV Eastern Promise',
    imo: '9876546',
    lat: 22.3193,
    lng: 114.1694,
    heading: 90,
    speed: 0,
    status: 'anchored',
    destination: 'Hong Kong',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '5',
    name: 'MV Nordic Spirit',
    imo: '9876547',
    lat: 35.4437,
    lng: 139.6380,
    heading: 315,
    speed: 14.8,
    status: 'sailing',
    destination: 'Tokyo',
    eta: new Date(Date.now() + 6 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
  },
];

const statusColors: Record<string, string> = {
  sailing: '#22c55e',
  anchored: '#f59e0b',
  moored: '#3b82f6',
  not_available: '#6b7280',
};

const statusLabels: Record<string, string> = {
  sailing: 'Sailing',
  anchored: 'Anchored',
  moored: 'Moored',
  not_available: 'N/A',
};

export function VesselMap({
  vessels = mockVessels,
  selectedVesselId,
  onVesselSelect,
  height = '500px',
  showControls = true,
  center = [20, 0],
  zoom = 2,
}: VesselMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [hoveredVessel, setHoveredVessel] = useState<VesselPosition | null>(null);

  // Calculate bounds to fit all vessels
  const getBounds = () => {
    if (vessels.length === 0) return null;
    const lats = vessels.map((v) => v.lat);
    const lngs = vessels.map((v) => v.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      ref={mapRef}
      className="relative overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-900"
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map placeholder - In production, integrate with Mapbox GL or Leaflet */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-slate-800 dark:to-slate-900">
        {/* World map background pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Vessel markers */}
        {vessels.map((vessel) => {
          // Simple projection (Mercator-like) for demo
          const x = ((vessel.lng + 180) / 360) * 100;
          const y = ((90 - vessel.lat) / 180) * 100;
          const isSelected = selectedVesselId === vessel.id;
          const isHovered = hoveredVessel?.id === vessel.id;

          return (
            <div
              key={vessel.id}
              className="absolute cursor-pointer transition-transform hover:scale-125"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${vessel.heading}deg)`,
                zIndex: isSelected || isHovered ? 20 : 10,
              }}
              onClick={() => onVesselSelect?.(vessel.id)}
              onMouseEnter={() => setHoveredVessel(vessel)}
              onMouseLeave={() => setHoveredVessel(null)}
            >
              <div
                className={`relative ${isSelected ? 'animate-pulse' : ''}`}
                style={{ transform: `rotate(-${vessel.heading}deg)` }}
              >
                {/* Vessel icon */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full shadow-lg"
                  style={{
                    backgroundColor: statusColors[vessel.status],
                    border: isSelected ? '3px solid white' : '2px solid white',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(59, 130, 246, 0.5)'
                      : undefined,
                  }}
                >
                  <Navigation
                    className="h-4 w-4 text-white"
                    style={{ transform: `rotate(${vessel.heading}deg)` }}
                  />
                </div>

                {/* Vessel label */}
                {(isSelected || isHovered) && (
                  <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs font-medium shadow-lg dark:bg-slate-800">
                    {vessel.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            onClick={toggleFullscreen}
            className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setMapStyle(mapStyle === 'streets' ? 'satellite' : 'streets')}
            className="rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            title="Toggle map style"
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Vessel info tooltip */}
      {hoveredVessel && (
        <Card className="absolute bottom-4 left-4 w-72 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${statusColors[hoveredVessel.status]}20` }}
            >
              <Ship
                className="h-5 w-5"
                style={{ color: statusColors[hoveredVessel.status] }}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{hoveredVessel.name}</h4>
              <p className="text-xs text-muted-foreground">IMO: {hoveredVessel.imo}</p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: statusColors[hoveredVessel.status] }}
            >
              {statusLabels[hoveredVessel.status]}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-medium">{hoveredVessel.speed} kn</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Heading</p>
              <p className="font-medium">{hoveredVessel.heading}°</p>
            </div>
            {hoveredVessel.destination && (
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-medium">{hoveredVessel.destination}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Last Update</p>
              <p className="font-medium">{formatTimeAgo(hoveredVessel.lastUpdate)}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {hoveredVessel.lat.toFixed(4)}°N, {hoveredVessel.lng.toFixed(4)}°E
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur dark:bg-slate-800/90">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Vessel Status</p>
        <div className="space-y-1">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: statusColors[key] }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vessel count */}
      <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-slate-800/90">
        <p className="text-sm font-medium">{vessels.length} Vessels</p>
      </div>
    </div>
  );
}
