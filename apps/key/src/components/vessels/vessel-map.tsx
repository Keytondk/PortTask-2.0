'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VesselPosition, VesselFull } from '@/lib/api';
import {
  Maximize2,
  Minimize2,
  Layers,
  Navigation,
  Anchor,
  Info,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

// Note: This component uses Mapbox GL. Make sure to add your Mapbox token
// to NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file

interface VesselMapProps {
  vessels?: VesselFull[];
  positions?: VesselPosition[];
  selectedVesselId?: string;
  onVesselSelect?: (vesselId: string) => void;
  showTrack?: boolean;
  trackData?: VesselPosition[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function VesselMap({
  vessels = [],
  positions = [],
  selectedVesselId,
  onVesselSelect,
  showTrack = false,
  trackData = [],
  center = [0, 20],
  zoom = 2,
  className,
}: VesselMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    // Dynamic import of mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = mapboxToken;

      map.current = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style:
          mapStyle === 'streets'
            ? 'mapbox://styles/mapbox/light-v11'
            : 'mapbox://styles/mapbox/satellite-streets-v12',
        center,
        zoom,
        attributionControl: false,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.default.NavigationControl({ showCompass: true }),
        'top-right'
      );

      // Add scale
      map.current.addControl(
        new mapboxgl.default.ScaleControl({ maxWidth: 100 }),
        'bottom-left'
      );

      map.current.on('load', () => {
        setMapLoaded(true);

        // Add track line source and layer
        if (map.current) {
          map.current.addSource('vessel-track', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [],
              },
            },
          });

          map.current.addLayer({
            id: 'vessel-track-line',
            type: 'line',
            source: 'vessel-track',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 3,
              'line-opacity': 0.8,
            },
          });
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when positions change
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    import('mapbox-gl').then((mapboxgl) => {
      // Remove old markers
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();

      // Create position lookup
      const positionMap = new Map(
        positions.map((p) => [p.vessel_id, p])
      );

      // Add new markers
      vessels.forEach((vessel) => {
        const position = vessel.current_position || positionMap.get(vessel.id);
        if (!position) return;

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        el.innerHTML = `
          <div class="w-8 h-8 relative cursor-pointer transform transition-transform hover:scale-110 ${
            selectedVesselId === vessel.id ? 'scale-125' : ''
          }">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                 style="transform: rotate(${position.heading || 0}deg)">
              <path d="M12 2L4 20L12 16L20 20L12 2Z"
                    fill="${selectedVesselId === vessel.id ? '#3b82f6' : '#1e293b'}"
                    stroke="white"
                    stroke-width="1"/>
            </svg>
          </div>
        `;

        // Create marker
        const marker = new mapboxgl.default.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([position.longitude, position.latitude])
          .addTo(map.current!);

        // Add click handler
        el.addEventListener('click', () => {
          onVesselSelect?.(vessel.id);
        });

        // Add hover effect
        el.addEventListener('mouseenter', () => {
          setHoveredVessel(vessel.id);
        });
        el.addEventListener('mouseleave', () => {
          setHoveredVessel(null);
        });

        markers.current.set(vessel.id, marker);
      });
    });
  }, [mapLoaded, vessels, positions, selectedVesselId, onVesselSelect]);

  // Update track line when track data changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !showTrack) return;

    const source = map.current.getSource('vessel-track') as mapboxgl.GeoJSONSource;
    if (source) {
      const coordinates = trackData.map((p) => [p.longitude, p.latitude]);
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }
  }, [mapLoaded, showTrack, trackData]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!mapContainer.current) return;

    if (!isFullscreen) {
      mapContainer.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle map style change
  const toggleMapStyle = useCallback(() => {
    if (!map.current) return;

    const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
    setMapStyle(newStyle);
    map.current.setStyle(
      newStyle === 'streets'
        ? 'mapbox://styles/mapbox/light-v11'
        : 'mapbox://styles/mapbox/satellite-streets-v12'
    );
  }, [mapStyle]);

  // Find hovered vessel info
  const hoveredVesselData = hoveredVessel
    ? vessels.find((v) => v.id === hoveredVessel)
    : null;
  const hoveredPosition = hoveredVessel
    ? positions.find((p) => p.vessel_id === hoveredVessel) ||
      hoveredVesselData?.current_position
    : null;

  return (
    <div className={clsx('relative rounded-lg overflow-hidden', className)}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />

      {/* Map controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={toggleMapStyle}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Toggle map style"
        >
          <Layers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          ) : (
            <Maximize2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Vessel count */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span className="text-slate-700 dark:text-slate-300">
            {vessels.length} vessels
          </span>
        </div>
      </div>

      {/* Hovered vessel info */}
      {hoveredVesselData && hoveredPosition && (
        <div className="absolute top-4 right-16 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-xs">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
            {hoveredVesselData.name}
          </h4>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              IMO: {hoveredVesselData.imo}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Flag: {hoveredVesselData.flag}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Speed: {hoveredPosition.speed?.toFixed(1) || 'N/A'} kn
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Heading: {hoveredPosition.heading?.toFixed(0) || 'N/A'}°
            </p>
            {hoveredPosition.destination && (
              <p className="text-slate-600 dark:text-slate-400">
                Dest: {hoveredPosition.destination}
              </p>
            )}
          </div>
        </div>
      )}

      {/* No mapbox token warning */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <div className="text-center p-6">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Map Not Configured
            </h3>
            <p className="text-slate-500 max-w-sm">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables to enable
              the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
