'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  Ship,
  MapPin,
  Navigation,
  Clock,
  Anchor,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

// Mock fleet data
const vessels = [
  {
    id: '1',
    name: 'MV Pacific Star',
    imo: '9876543',
    flag: 'Panama',
    type: 'Container',
    status: 'at_sea',
    position: { lat: 1.2897, lng: 103.8501 },
    destination: 'Singapore',
    eta: '2024-01-15T08:00:00Z',
    speed: 14.5,
    heading: 245,
    lastUpdate: '2024-01-14T12:30:00Z',
  },
  {
    id: '2',
    name: 'MV Atlantic Voyager',
    imo: '9876544',
    flag: 'Liberia',
    type: 'Bulk Carrier',
    status: 'in_port',
    position: { lat: 51.9225, lng: 4.4792 },
    destination: 'Rotterdam',
    eta: null,
    speed: 0,
    heading: null,
    lastUpdate: '2024-01-14T12:28:00Z',
  },
  {
    id: '3',
    name: 'MV Nordic Wind',
    imo: '9876545',
    flag: 'Norway',
    type: 'Tanker',
    status: 'at_sea',
    position: { lat: 53.5511, lng: 9.9937 },
    destination: 'Hamburg',
    eta: '2024-01-16T14:00:00Z',
    speed: 12.2,
    heading: 78,
    lastUpdate: '2024-01-14T12:25:00Z',
  },
  {
    id: '4',
    name: 'MV Southern Cross',
    imo: '9876546',
    flag: 'Marshall Islands',
    type: 'Container',
    status: 'at_anchor',
    position: { lat: 22.2855, lng: 114.1577 },
    destination: 'Hong Kong',
    eta: '2024-01-14T18:00:00Z',
    speed: 0,
    heading: 180,
    lastUpdate: '2024-01-14T12:20:00Z',
  },
];

const statusConfig = {
  at_sea: { label: 'At Sea', color: 'bg-blue-100 text-blue-700', icon: Navigation },
  in_port: { label: 'In Port', color: 'bg-green-100 text-green-700', icon: Anchor },
  at_anchor: { label: 'At Anchor', color: 'bg-amber-100 text-amber-700', icon: Clock },
};

export default function VesselsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredVessels = vessels.filter((vessel) => {
    const matchesSearch =
      vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.imo.includes(searchQuery);
    const matchesStatus = !statusFilter || vessel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PortalShell>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fleet Overview</h1>
            <p className="text-slate-600 mt-1">Track your vessels in real-time</p>
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Total Vessels</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{vessels.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">At Sea</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {vessels.filter((v) => v.status === 'at_sea').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">In Port</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {vessels.filter((v) => v.status === 'in_port').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">At Anchor</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {vessels.filter((v) => v.status === 'at_anchor').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vessel name or IMO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === null
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vessel List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Vessel
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                ETA
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Speed / Course
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVessels.map((vessel) => {
              const status = statusConfig[vessel.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <tr key={vessel.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Ship className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{vessel.name}</div>
                        <div className="text-sm text-slate-500">
                          IMO: {vessel.imo} • {vessel.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-900">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {vessel.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(vessel.eta)}</td>
                  <td className="px-6 py-4">
                    {vessel.speed > 0 ? (
                      <div className="text-slate-900">
                        {vessel.speed} kn / {vessel.heading}°
                      </div>
                    ) : (
                      <span className="text-slate-400">Stationary</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(vessel.lastUpdate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredVessels.length === 0 && (
          <div className="p-12 text-center">
            <Ship className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 mt-2">No vessels found</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
