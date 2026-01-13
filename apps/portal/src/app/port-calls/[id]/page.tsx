'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  Ship,
  MapPin,
  Calendar,
  Clock,
  Anchor,
  ArrowLeft,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { api, PortCall } from '@/lib/api';

interface PortCallData {
  id: string;
  reference: string;
  status: string;
  vessel: { name: string; imo: string; flag: string; type: string };
  port: { name: string; country: string; terminal: string };
  eta: string;
  etd: string;
  ata: string | null;
  berth: string;
  services: { id: string; type: string; status: string; vendor: string | null; cost: number | null }[];
  timeline: { time: string; event: string; type: string }[];
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  arrived: 'bg-green-100 text-green-700',
  alongside: 'bg-amber-100 text-amber-700',
  departed: 'bg-gray-100 text-gray-700',
  completed: 'bg-green-100 text-green-700',
};

const serviceStatusColors = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

export default function PortCallDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PortCallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortCall() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getPortCall(params.id);
        const apiData = response.data;

        setData({
          id: apiData.id,
          reference: apiData.reference,
          status: apiData.status,
          vessel: {
            name: apiData.vessel?.name || 'Unknown Vessel',
            imo: apiData.vessel?.imo || '',
            flag: apiData.vessel?.flag || '',
            type: apiData.vessel?.type || '',
          },
          port: {
            name: apiData.port?.name || 'Unknown Port',
            country: apiData.port?.country || '',
            terminal: apiData.berth_terminal || '',
          },
          eta: apiData.eta || '',
          etd: apiData.etd || '',
          ata: apiData.ata || null,
          berth: apiData.berth_name || '',
          services: [],
          timeline: [],
        });

        // Fetch services
        try {
          const servicesResponse = await api.getPortCallServices(params.id);
          const services = servicesResponse.data.map((s) => ({
            id: s.id,
            type: s.service_type?.name || 'Service',
            status: s.status,
            vendor: s.vendor?.name || null,
            cost: s.final_price || s.quoted_price || null,
          }));
          setData((prev) => prev ? { ...prev, services } : null);
        } catch {
          // Services endpoint might not exist yet
        }
      } catch (err) {
        console.error('Failed to fetch port call:', err);
        setError('Failed to load port call details');
      } finally {
        setLoading(false);
      }
    }

    fetchPortCall();
  }, [params.id]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <PortalShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PortalShell>
    );
  }

  if (error || !data) {
    return (
      <PortalShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-medium text-slate-900">{error || 'Port call not found'}</p>
          <Link
            href="/port-calls"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Port Calls
          </Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/port-calls"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Port Calls
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{data.reference}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[data.status as keyof typeof statusColors]
                }`}
              >
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </span>
            </div>
            <p className="text-slate-600 mt-1">
              {data.vessel.name} • {data.port.name}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vessel & Port Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ship className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Vessel</h3>
                  <p className="text-sm text-slate-500">{data.vessel.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">IMO</span>
                  <span className="text-slate-900 font-medium">{data.vessel.imo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Flag</span>
                  <span className="text-slate-900">{data.vessel.flag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-900">{data.vessel.type}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Port</h3>
                  <p className="text-sm text-slate-500">{data.port.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Country</span>
                  <span className="text-slate-900">{data.port.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Terminal</span>
                  <span className="text-slate-900">{data.port.terminal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Berth</span>
                  <span className="text-slate-900 font-medium">{data.berth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Schedule</h3>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wide">ETA</div>
                <div className="font-semibold text-slate-900 mt-1">{formatDate(data.eta)}</div>
                <div className="text-sm text-slate-600">{formatTime(data.eta)}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 uppercase tracking-wide">ATA</div>
                <div className="font-semibold text-slate-900 mt-1">{formatDate(data.ata)}</div>
                <div className="text-sm text-slate-600">{formatTime(data.ata)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wide">ETD</div>
                <div className="font-semibold text-slate-900 mt-1">{formatDate(data.etd)}</div>
                <div className="text-sm text-slate-600">{formatTime(data.etd)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wide">ATD</div>
                <div className="font-semibold text-slate-900 mt-1">-</div>
                <div className="text-sm text-slate-400">Pending</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Services</h3>
            <div className="space-y-3">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        service.status === 'completed'
                          ? 'bg-green-100'
                          : service.status === 'in_progress'
                          ? 'bg-amber-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {service.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : service.status === 'in_progress' ? (
                        <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{service.type}</div>
                      <div className="text-sm text-slate-500">
                        {service.vendor || 'Vendor pending'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        serviceStatusColors[service.status as keyof typeof serviceStatusColors]
                      }`}
                    >
                      {service.status.replace('_', ' ')}
                    </span>
                    {service.cost && (
                      <div className="text-sm font-medium text-slate-900 mt-1">
                        ${service.cost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {data.timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {index < data.timeline.length - 1 && (
                      <div className="w-px h-full bg-slate-200 mt-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm font-medium text-slate-900">{event.event}</div>
                    <div className="text-xs text-slate-500">
                      {formatDate(event.time)} at {formatTime(event.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Port Agent</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Anchor className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Singapore Maritime Services</div>
                <div className="text-sm text-slate-500">+65 1234 5678</div>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Cost Summary</h3>
            <div className="space-y-2">
              {data.services
                .filter((s) => s.cost)
                .map((service) => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{service.type}</span>
                    <span className="text-slate-900">${service.cost?.toLocaleString()}</span>
                  </div>
                ))}
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">
                    $
                    {data.services
                      .reduce((sum, s) => sum + (s.cost || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
