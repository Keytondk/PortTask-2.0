'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input, Badge } from '@navo/ui';
import {
  Ship,
  Search,
  Filter,
  List,
  Map,
  Navigation,
  Anchor,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { VesselMap } from '@/components/maps/VesselMap';

// Mock fleet data
const vessels = [
  {
    id: '1',
    name: 'MV Pacific Star',
    imo: '9876543',
    type: 'Container',
    flag: 'SG',
    lat: 1.2644,
    lng: 103.8198,
    heading: 45,
    speed: 12.5,
    status: 'sailing' as const,
    destination: 'Singapore',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    lastUpdate: new Date(),
  },
  {
    id: '2',
    name: 'MV Atlantic Voyager',
    imo: '9876544',
    type: 'Bulk Carrier',
    flag: 'PA',
    lat: 51.9074,
    lng: 4.4884,
    heading: 180,
    speed: 0,
    status: 'moored' as const,
    destination: 'Rotterdam',
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'MV Global Pioneer',
    imo: '9876545',
    type: 'Tanker',
    flag: 'LR',
    lat: 29.7604,
    lng: -95.3698,
    heading: 270,
    speed: 8.2,
    status: 'sailing' as const,
    destination: 'Houston',
    eta: new Date(Date.now() + 12 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '4',
    name: 'MV Eastern Promise',
    imo: '9876546',
    type: 'Container',
    flag: 'HK',
    lat: 22.3193,
    lng: 114.1694,
    heading: 90,
    speed: 0,
    status: 'anchored' as const,
    destination: 'Hong Kong',
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '5',
    name: 'MV Nordic Spirit',
    imo: '9876547',
    type: 'LNG Carrier',
    flag: 'NO',
    lat: 35.4437,
    lng: 139.6380,
    heading: 315,
    speed: 14.8,
    status: 'sailing' as const,
    destination: 'Tokyo',
    eta: new Date(Date.now() + 6 * 60 * 60 * 1000),
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  sailing: {
    label: 'Sailing',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  anchored: {
    label: 'Anchored',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  moored: {
    label: 'Moored',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  not_available: {
    label: 'N/A',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

function formatTimeAgo(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatETA(date?: Date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FleetMapPage() {
  const [selectedVesselId, setSelectedVesselId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'split'>('split');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredVessels = vessels.filter((vessel) => {
    const matchesSearch =
      vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.imo.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || vessel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId);

  // Stats
  const stats = {
    total: vessels.length,
    sailing: vessels.filter((v) => v.status === 'sailing').length,
    anchored: vessels.filter((v) => v.status === 'anchored').length,
    moored: vessels.filter((v) => v.status === 'moored').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Map</h1>
          <p className="text-muted-foreground">
            Real-time vessel tracking and fleet overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <Map className="mr-2 h-4 w-4" />
            Map Only
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            <List className="mr-2 h-4 w-4" />
            Split View
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Ship className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Fleet</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Navigation className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sailing}</p>
              <p className="text-sm text-muted-foreground">Sailing</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Anchor className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.anchored}</p>
              <p className="text-sm text-muted-foreground">Anchored</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Ship className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.moored}</p>
              <p className="text-sm text-muted-foreground">Moored</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main content */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'lg:grid-cols-3' : ''}`}>
        {/* Map */}
        <div className={viewMode === 'split' ? 'lg:col-span-2' : ''}>
          <VesselMap
            vessels={filteredVessels}
            selectedVesselId={selectedVesselId}
            onVesselSelect={setSelectedVesselId}
            height={viewMode === 'map' ? '700px' : '600px'}
          />
        </div>

        {/* Vessel list */}
        {viewMode === 'split' && (
          <div className="space-y-4">
            {/* Search and filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vessels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'sailing', 'anchored', 'moored'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status === 'all' ? 'All' : status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Vessel list */}
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {filteredVessels.map((vessel) => (
                <Card
                  key={vessel.id}
                  className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
                    selectedVesselId === vessel.id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => setSelectedVesselId(vessel.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Ship className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{vessel.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          IMO: {vessel.imo} · {vessel.type}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusConfig[vessel.status]?.color}>
                      {statusConfig[vessel.status]?.label}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Speed</p>
                      <p className="font-medium">{vessel.speed} kn</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Heading</p>
                      <p className="font-medium">{vessel.heading}°</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{vessel.destination || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-medium">{formatETA(vessel.eta)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(vessel.lastUpdate)}
                    </span>
                    <Link
                      href={`/vessels/${vessel.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View details
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
