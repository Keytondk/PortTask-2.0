'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  Ship,
  MapPin,
  Calendar,
  Search,
  Filter,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const portCalls = [
  {
    id: '1',
    reference: 'PC-2024-001',
    vessel: { name: 'MV Pacific Star', imo: '9876543', type: 'Container' },
    port: { name: 'Singapore', unlocode: 'SGSIN', country: 'Singapore' },
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    etd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    services: 3,
  },
  {
    id: '2',
    reference: 'PC-2024-002',
    vessel: { name: 'MV Atlantic Voyager', imo: '9876544', type: 'Tanker' },
    port: { name: 'Rotterdam', unlocode: 'NLRTM', country: 'Netherlands' },
    eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'planned',
    services: 5,
  },
  {
    id: '3',
    reference: 'PC-2024-003',
    vessel: { name: 'MV Indian Ocean', imo: '9876545', type: 'Bulk Carrier' },
    port: { name: 'Dubai', unlocode: 'AEDXB', country: 'UAE' },
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    etd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
    services: 2,
  },
  {
    id: '4',
    reference: 'PC-2024-004',
    vessel: { name: 'MV Northern Wind', imo: '9876546', type: 'RORO' },
    port: { name: 'Hamburg', unlocode: 'DEHAM', country: 'Germany' },
    eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    etd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'alongside',
    services: 4,
  },
];

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  arrived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alongside: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  departed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function PortCallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredCalls = portCalls.filter((call) => {
    const matchesSearch =
      !searchQuery ||
      call.vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.port.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PortalShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Port Calls
          </h1>
          <p className="text-slate-500 mt-1">
            View and track all port calls for your fleet
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vessel, port, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Arrived</option>
              <option value="alongside">Alongside</option>
              <option value="departed">Departed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Port Calls List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredCalls.map((call) => (
              <Link
                key={call.id}
                href={`/port-calls/${call.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ship className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {call.vessel.name}
                    </h3>
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                        statusColors[call.status as keyof typeof statusColors]
                      )}
                    >
                      {call.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>{call.reference}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {call.port.name}, {call.port.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      ETA: {format(new Date(call.eta), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {call.services} services
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(call.eta), { addSuffix: true })}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {filteredCalls.length === 0 && (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No port calls found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
