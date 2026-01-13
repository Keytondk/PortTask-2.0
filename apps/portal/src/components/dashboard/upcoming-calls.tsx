'use client';

import Link from 'next/link';
import { Ship, MapPin, Calendar, ArrowRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const upcomingCalls = [
  {
    id: '1',
    reference: 'PC-2024-001',
    vessel: { name: 'MV Pacific Star', imo: '9876543' },
    port: { name: 'Singapore', unlocode: 'SGSIN' },
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
  },
  {
    id: '2',
    reference: 'PC-2024-002',
    vessel: { name: 'MV Atlantic Voyager', imo: '9876544' },
    port: { name: 'Rotterdam', unlocode: 'NLRTM' },
    eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'planned',
  },
  {
    id: '3',
    reference: 'PC-2024-003',
    vessel: { name: 'MV Indian Ocean', imo: '9876545' },
    port: { name: 'Dubai', unlocode: 'AEDXB' },
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'planned',
  },
];

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  planned: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  arrived: 'bg-amber-100 text-amber-700',
  alongside: 'bg-purple-100 text-purple-700',
  departed: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function UpcomingCalls() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Upcoming Port Calls
        </h2>
        <Link
          href="/port-calls"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {upcomingCalls.map((call) => (
          <Link
            key={call.id}
            href={`/port-calls/${call.id}`}
            className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Ship className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">
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
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {call.port.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(call.eta), 'MMM d')}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                ETA
              </p>
              <p className="text-sm text-slate-500">
                {formatDistanceToNow(new Date(call.eta), { addSuffix: true })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {upcomingCalls.length === 0 && (
        <div className="p-8 text-center">
          <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No upcoming port calls</p>
        </div>
      )}
    </div>
  );
}
