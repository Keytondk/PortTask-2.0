'use client';

import { Suspense, useEffect, useState } from 'react';
import { Button, Card, Badge } from '@navo/ui';
import {
  ArrowLeft,
  Ship,
  MapPin,
  Calendar,
  User,
  FileText,
  Plus,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PortCallServices } from '@/components/port-calls/port-call-services';
import { PortCallTimeline } from '@/components/port-calls/port-call-timeline';
import { api, PortCall } from '@/lib/api';

interface PortCallData {
  id: string;
  reference: string;
  vessel: {
    id: string;
    name: string;
    type: string;
    imo: string;
    flag: string;
  };
  port: {
    id: string;
    name: string;
    unlocode: string;
    country: string;
  };
  workspace: { id: string; name: string };
  status: string;
  eta: Date | null;
  etd: Date | null;
  ata: Date | null;
  atd: Date | null;
  berth: { name: string; terminal: string; confirmedAt: Date } | null;
  agent: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  arrived: 'bg-purple-100 text-purple-800',
  alongside: 'bg-indigo-100 text-indigo-800',
  departed: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PortCallDetailPage() {
  const params = useParams<{ id: string }>();
  const [portCall, setPortCall] = useState<PortCallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortCall() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getPortCall(params.id);
        const data = response.data;

        // Transform API response to component format
        setPortCall({
          id: data.id,
          reference: data.reference,
          vessel: data.vessel || { id: '', name: 'Unknown Vessel', type: '', imo: '', flag: '' },
          port: data.port || { id: '', name: 'Unknown Port', unlocode: '', country: '' },
          workspace: { id: data.workspace_id, name: 'Workspace' },
          status: data.status,
          eta: data.eta ? new Date(data.eta) : null,
          etd: data.etd ? new Date(data.etd) : null,
          ata: data.ata ? new Date(data.ata) : null,
          atd: data.atd ? new Date(data.atd) : null,
          berth: data.berth_name ? {
            name: data.berth_name,
            terminal: data.berth_terminal || '',
            confirmedAt: data.berth_confirmed_at ? new Date(data.berth_confirmed_at) : new Date(),
          } : null,
          agent: data.agent_id ? { id: data.agent_id, name: 'Port Agent' } : null,
          createdBy: { id: data.created_by, name: 'Operator' },
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        });
      } catch (err) {
        console.error('Failed to fetch port call:', err);
        setError('Failed to load port call details');
      } finally {
        setLoading(false);
      }
    }

    fetchPortCall();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !portCall) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'Port call not found'}</p>
        <Link href="/port-calls">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Port Calls
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/port-calls"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{portCall.reference}</h1>
              <Badge className={statusColors[portCall.status]}>
                {portCall.status.charAt(0).toUpperCase() +
                  portCall.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {portCall.vessel.name} at {portCall.port.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </Button>
          <Link href={`/port-calls/${portCall.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Vessel & Port Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Port Call Details</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Vessel */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Vessel
                </h3>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Ship className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{portCall.vessel.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {portCall.vessel.type} | IMO {portCall.vessel.imo}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Flag: {portCall.vessel.flag}
                    </div>
                  </div>
                </div>
              </div>

              {/* Port */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Port
                </h3>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{portCall.port.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {portCall.port.unlocode} | {portCall.port.country}
                    </div>
                    {portCall.berth && (
                      <div className="text-sm text-muted-foreground">
                        Berth: {portCall.berth.name} ({portCall.berth.terminal})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="mt-6 border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                Schedule
              </h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">ETA</div>
                  <div className="font-medium">{formatDate(portCall.eta)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ATA</div>
                  <div className="font-medium">
                    {portCall.ata ? formatDate(portCall.ata) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ETD</div>
                  <div className="font-medium">{formatDate(portCall.etd)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ATD</div>
                  <div className="font-medium">
                    {portCall.atd ? formatDate(portCall.atd) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent */}
            {portCall.agent && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Port Agent
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{portCall.agent.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Contact agent for berthing and clearance
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Services */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Services</h2>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
            <Suspense fallback={<div>Loading services...</div>}>
              <PortCallServices portCallId={params.id} />
            </Suspense>
          </Card>
        </div>

        {/* Right column - Timeline */}
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
            <Suspense fallback={<div>Loading timeline...</div>}>
              <PortCallTimeline portCallId={params.id} />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  );
}
