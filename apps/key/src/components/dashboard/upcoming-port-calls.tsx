'use client';

import { Badge } from '@navo/ui';
import { Ship, MapPin, Calendar, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with API call
const upcomingPortCalls = [
  {
    id: '1',
    reference: 'PC-25-0001',
    vessel: { name: 'MV Pacific Star', type: 'Container' },
    port: { name: 'Singapore', unlocode: 'SGSIN' },
    status: 'confirmed',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    services: 3,
  },
  {
    id: '2',
    reference: 'PC-25-0002',
    vessel: { name: 'MV Atlantic Voyager', type: 'Bulk Carrier' },
    port: { name: 'Rotterdam', unlocode: 'NLRTM' },
    status: 'alongside',
    eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    services: 2,
  },
  {
    id: '3',
    reference: 'PC-25-0003',
    vessel: { name: 'MT Gulf Trader', type: 'Tanker' },
    port: { name: 'Dubai (Jebel Ali)', unlocode: 'AEJEA' },
    status: 'planned',
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    services: 1,
  },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  arrived: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  alongside: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  departed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateMobile(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function UpcomingPortCalls() {
  return (
    <div className="space-y-3">
      {upcomingPortCalls.map((portCall) => (
        <Link
          key={portCall.id}
          href={`/port-calls/${portCall.id}`}
          className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md"
        >
          {/* Mobile layout */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{portCall.vessel.name}</p>
                <p className="text-sm text-muted-foreground">{portCall.port.name}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-3 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDateMobile(portCall.eta)}</span>
              <ArrowRight className="h-3 w-3" />
              <span>{formatDateMobile(portCall.etd)}</span>
            </div>
            <Badge className={statusColors[portCall.status]}>
              {portCall.status.charAt(0).toUpperCase() + portCall.status.slice(1)}
            </Badge>
          </div>

          {/* Desktop layout */}
          <div className="hidden items-start justify-between md:flex">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Ship className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{portCall.vessel.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {portCall.reference}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {portCall.port.name} ({portCall.port.unlocode})
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>ETA: {formatDate(portCall.eta)}</span>
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <span>ETD: {formatDate(portCall.etd)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[portCall.status]}>
                {portCall.status.charAt(0).toUpperCase() + portCall.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {portCall.services} service{portCall.services !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
