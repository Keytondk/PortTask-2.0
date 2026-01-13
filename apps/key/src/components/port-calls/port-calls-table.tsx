'use client';

import { Badge } from '@navo/ui';
import { Ship, MapPin, MoreHorizontal, Eye, Edit, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with API call
const portCalls = [
  {
    id: '1',
    reference: 'PC-25-0001',
    vessel: { name: 'MV Pacific Star', type: 'Container', imo: '9876543' },
    port: { name: 'Singapore', unlocode: 'SGSIN', country: 'Singapore' },
    status: 'confirmed',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    ata: null,
    atd: null,
    berth: { name: 'Berth 12', terminal: 'PSA Terminal' },
    agent: 'Singapore Maritime Agency',
    services: 3,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    reference: 'PC-25-0002',
    vessel: { name: 'MV Atlantic Voyager', type: 'Bulk Carrier', imo: '9876544' },
    port: { name: 'Rotterdam', unlocode: 'NLRTM', country: 'Netherlands' },
    status: 'alongside',
    eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    ata: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    atd: null,
    berth: { name: 'Euromax Berth 3', terminal: 'Euromax Terminal' },
    agent: null,
    services: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    reference: 'PC-25-0003',
    vessel: { name: 'MT Gulf Trader', type: 'Tanker', imo: '9876545' },
    port: { name: 'Dubai (Jebel Ali)', unlocode: 'AEJEA', country: 'UAE' },
    status: 'planned',
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ata: null,
    atd: null,
    berth: null,
    agent: null,
    services: 1,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    reference: 'PC-25-0004',
    vessel: { name: 'MV Pacific Star', type: 'Container', imo: '9876543' },
    port: { name: 'Houston', unlocode: 'USHOU', country: 'United States' },
    status: 'draft',
    eta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
    ata: null,
    atd: null,
    berth: null,
    agent: null,
    services: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    reference: 'PC-25-0005',
    vessel: { name: 'MV Atlantic Voyager', type: 'Bulk Carrier', imo: '9876544' },
    port: { name: 'Shanghai', unlocode: 'CNSHA', country: 'China' },
    status: 'completed',
    eta: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    etd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ata: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    atd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    berth: { name: 'Yangshan T4', terminal: 'Yangshan Deep Water Port' },
    agent: null,
    services: 4,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
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

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function PortCallsTable() {
  return (
    <>
      {/* Mobile view */}
      <div className="space-y-3 p-4 lg:hidden">
        {portCalls.map((portCall) => (
          <Link
            key={portCall.id}
            href={`/port-calls/${portCall.id}`}
            className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
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
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDateShort(portCall.eta)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{formatDateShort(portCall.etd)}</span>
              </div>
              <Badge className={statusColors[portCall.status]}>
                {portCall.status.charAt(0).toUpperCase() + portCall.status.slice(1)}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Vessel</th>
              <th className="px-4 py-3 font-medium">Port</th>
              <th className="px-4 py-3 font-medium">ETA</th>
              <th className="px-4 py-3 font-medium">ETD</th>
              <th className="px-4 py-3 font-medium">Berth</th>
              <th className="px-4 py-3 font-medium">Services</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {portCalls.map((portCall) => (
              <tr key={portCall.id} className="group transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/port-calls/${portCall.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {portCall.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Ship className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{portCall.vessel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {portCall.vessel.type} | IMO {portCall.vessel.imo}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{portCall.port.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {portCall.port.unlocode}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{formatDate(portCall.eta)}</div>
                  {portCall.ata && (
                    <div className="text-xs text-green-600">
                      ATA: {formatDate(portCall.ata)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{formatDate(portCall.etd)}</div>
                  {portCall.atd && (
                    <div className="text-xs text-green-600">
                      ATD: {formatDate(portCall.atd)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {portCall.berth ? (
                    <div>
                      <div>{portCall.berth.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {portCall.berth.terminal}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{portCall.services}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusColors[portCall.status]}>
                    {portCall.status.charAt(0).toUpperCase() +
                      portCall.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/port-calls/${portCall.id}`}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link
                      href={`/port-calls/${portCall.id}/edit`}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <button className="rounded p-1.5 hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
