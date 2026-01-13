'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
} from '@navo/ui';
import {
  ArrowLeft,
  Ship,
  MapPin,
  Anchor,
  Calendar,
  Edit,
  MoreHorizontal,
  Navigation,
  Gauge,
  Ruler,
  Box,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { vesselApi, VesselFull, VesselPosition } from '@/lib/api';

interface VesselData {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  callSign: string;
  type: string;
  flag: string;
  flagCode: string;
  class: string;
  dwt: number;
  grt: number;
  nrt: number;
  loa: number;
  beam: number;
  draft: number;
  yearBuilt: number;
  builder: string;
  status: string;
  currentLocation: string;
  currentCoordinates: { lat: number; lng: number };
  destination: string;
  eta: Date;
  speed: number;
  course: number;
  owner: string;
  operator: string;
  manager: string;
  crew: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  at_sea: {
    label: 'At Sea',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  in_port: {
    label: 'In Port',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  at_anchor: {
    label: 'At Anchor',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  under_repair: {
    label: 'Under Repair',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  },
  completed: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function VesselDetailPage() {
  const params = useParams<{ id: string }>();
  const [vessel, setVessel] = useState<VesselData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentPortCalls] = useState<any[]>([]);
  const [upcomingPortCalls] = useState<any[]>([]);

  useEffect(() => {
    async function fetchVessel() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await vesselApi.getVessel(params.id);
        const data = response.data;
        const position = data.current_position;

        setVessel({
          id: data.id,
          name: data.name,
          imo: data.imo,
          mmsi: data.mmsi || '',
          callSign: '',
          type: data.type,
          flag: data.flag,
          flagCode: data.flag.substring(0, 2).toUpperCase(),
          class: 'DNV GL',
          dwt: data.deadweight || 0,
          grt: data.gross_tonnage || 0,
          nrt: 0,
          loa: data.length_overall || 0,
          beam: data.beam || 0,
          draft: data.draft || 0,
          yearBuilt: data.year_built || 0,
          builder: '',
          status: position?.nav_status || 'unknown',
          currentLocation: position?.destination || 'Unknown',
          currentCoordinates: {
            lat: position?.latitude || 0,
            lng: position?.longitude || 0,
          },
          destination: position?.destination || '',
          eta: position?.eta ? new Date(position.eta) : new Date(),
          speed: position?.speed || 0,
          course: position?.course || 0,
          owner: '',
          operator: '',
          manager: '',
          crew: 0,
        });
      } catch (err) {
        console.error('Failed to fetch vessel:', err);
        setError('Failed to load vessel details');
      } finally {
        setLoading(false);
      }
    }

    fetchVessel();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !vessel) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'Vessel not found'}</p>
        <Link href="/vessels">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vessels
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/vessels"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vessels
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Ship className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{vessel.name}</h1>
                <Badge className={statusConfig[vessel.status]?.color}>
                  {statusConfig[vessel.status]?.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                IMO {vessel.imo} · {vessel.type} · {vessel.flag}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Current position card */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Current Position</h2>
          <span className="text-xs text-muted-foreground">Updated 15 min ago</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{vessel.currentLocation}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Navigation className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destination</p>
              <p className="font-medium">{vessel.destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Gauge className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Speed / Course</p>
              <p className="font-medium">{vessel.speed} kn / {vessel.course}°</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ETA</p>
              <p className="font-medium">{formatDateTime(vessel.eta)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="port-calls">Port Calls</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Specifications */}
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Specifications</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem icon={Ruler} label="Length Overall (LOA)" value={`${vessel.loa} m`} />
                <DetailItem icon={Ruler} label="Beam" value={`${vessel.beam} m`} />
                <DetailItem icon={Ruler} label="Draft" value={`${vessel.draft} m`} />
                <DetailItem icon={Box} label="Deadweight (DWT)" value={`${vessel.dwt.toLocaleString()} MT`} />
                <DetailItem icon={Box} label="Gross Tonnage" value={`${vessel.grt.toLocaleString()} GT`} />
                <DetailItem icon={Box} label="Net Tonnage" value={`${vessel.nrt.toLocaleString()} NT`} />
              </div>
            </Card>

            {/* Identification */}
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Identification</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="IMO Number" value={vessel.imo} />
                <DetailItem label="MMSI" value={vessel.mmsi} />
                <DetailItem label="Call Sign" value={vessel.callSign} />
                <DetailItem label="Flag" value={vessel.flag} />
                <DetailItem label="Class" value={vessel.class} />
                <DetailItem label="Year Built" value={vessel.yearBuilt} />
              </div>
            </Card>

            {/* Ownership */}
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 font-semibold">Ownership & Management</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailItem label="Owner" value={vessel.owner} />
                <DetailItem label="Operator" value={vessel.operator} />
                <DetailItem label="Technical Manager" value={vessel.manager} />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="port-calls" className="space-y-4">
          {/* Upcoming Port Calls */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Upcoming Port Calls</h3>
            {upcomingPortCalls.length > 0 ? (
              <div className="space-y-3">
                {upcomingPortCalls.map((portCall) => (
                  <Link
                    key={portCall.id}
                    href={`/port-calls/${portCall.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Anchor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{portCall.port}</p>
                        <p className="text-sm text-muted-foreground">
                          ETA {formatDateTime(portCall.eta)}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusConfig[portCall.status]?.color}>
                      {statusConfig[portCall.status]?.label}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming port calls scheduled</p>
            )}
          </Card>

          {/* Recent Port Calls */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Recent Port Calls</h3>
            <div className="space-y-3">
              {recentPortCalls.map((portCall) => (
                <Link
                  key={portCall.id}
                  href={`/port-calls/${portCall.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Anchor className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{portCall.port}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(portCall.arrival)} - {formatDate(portCall.departure)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{portCall.reference}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Certificates & Documents</h3>
            <div className="space-y-3">
              {[
                { name: 'Certificate of Registry', expiry: 'Dec 2025', status: 'valid' },
                { name: 'Safety Management Certificate', expiry: 'Jun 2025', status: 'valid' },
                { name: 'International Tonnage Certificate', expiry: 'Dec 2026', status: 'valid' },
                { name: 'P&I Insurance', expiry: 'Feb 2025', status: 'expiring' },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">Expires: {doc.expiry}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      doc.status === 'valid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    }
                  >
                    {doc.status === 'valid' ? 'Valid' : 'Expiring Soon'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
