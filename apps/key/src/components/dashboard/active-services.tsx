'use client';

import { Badge } from '@navo/ui';
import { Fuel, Droplets, Trash2, Wrench, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with API call
const activeServices = [
  {
    id: '1',
    type: 'Bunker Supply',
    icon: Fuel,
    portCall: { reference: 'PC-25-0001', vessel: 'MV Pacific Star' },
    vendor: 'Marine Fuel Solutions',
    status: 'confirmed',
    quantity: '500 MT VLSFO',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    price: '$325,000',
  },
  {
    id: '2',
    type: 'Fresh Water Supply',
    icon: Droplets,
    portCall: { reference: 'PC-25-0001', vessel: 'MV Pacific Star' },
    vendor: 'Pending',
    status: 'requested',
    quantity: '200 MT',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    price: 'TBD',
  },
  {
    id: '3',
    type: 'Provisions Supply',
    icon: Wrench,
    portCall: { reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager' },
    vendor: 'Port Services International',
    status: 'in_progress',
    quantity: '1 Lot (25 crew)',
    scheduledDate: new Date(),
    price: '€8,500',
  },
  {
    id: '4',
    type: 'Waste Disposal',
    icon: Trash2,
    portCall: { reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager' },
    vendor: 'Port Services International',
    status: 'completed',
    quantity: '15 CBM',
    scheduledDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
    price: '€2,200',
  },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  rfq_sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  quoted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
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

export function ActiveServices() {
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {activeServices.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{service.type}</p>
                  <p className="text-sm text-muted-foreground">{service.portCall.vessel}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{service.vendor}</span>
              <span className="font-medium">{service.price}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDateMobile(service.scheduledDate)}</span>
              <Badge className={statusColors[service.status]}>
                {service.status.replace('_', ' ')}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Service</th>
              <th className="pb-3 font-medium">Port Call</th>
              <th className="pb-3 font-medium">Vendor</th>
              <th className="pb-3 font-medium">Quantity</th>
              <th className="pb-3 font-medium">Scheduled</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeServices.map((service) => (
              <tr key={service.id} className="group transition-colors hover:bg-muted/50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <service.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{service.type}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="text-sm">
                    <div className="font-medium">{service.portCall.reference}</div>
                    <div className="text-muted-foreground">{service.portCall.vessel}</div>
                  </div>
                </td>
                <td className="py-4 text-sm">{service.vendor}</td>
                <td className="py-4 text-sm">{service.quantity}</td>
                <td className="py-4 text-sm">{formatDate(service.scheduledDate)}</td>
                <td className="py-4 text-sm font-semibold">{service.price}</td>
                <td className="py-4">
                  <Badge className={statusColors[service.status]}>
                    {service.status.replace('_', ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
