'use client';

import { Badge, Button } from '@navo/ui';
import {
  Fuel,
  Droplets,
  Trash2,
  Wrench,
  Package,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with API call
const services = [
  {
    id: '1',
    type: { name: 'Bunker Supply', category: 'bunker', icon: Fuel },
    status: 'confirmed',
    description: 'VLSFO supply',
    quantity: '500 MT',
    vendor: { name: 'Marine Fuel Solutions' },
    requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    confirmedDate: new Date(),
    quotedPrice: 325000,
    currency: 'USD',
  },
  {
    id: '2',
    type: { name: 'Fresh Water Supply', category: 'provisions', icon: Droplets },
    status: 'requested',
    description: 'Potable water supply',
    quantity: '200 MT',
    vendor: null,
    requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    confirmedDate: null,
    quotedPrice: null,
    currency: 'USD',
  },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  requested: 'bg-yellow-100 text-yellow-800',
  rfq_sent: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
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

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return 'TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

export function PortCallServices({ portCallId }: { portCallId: string }) {
  if (services.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No services added yet</p>
        <p className="text-sm text-muted-foreground">
          Add services to manage bunker, provisions, repairs, and more
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-start justify-between rounded-lg border p-4"
        >
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <service.type.icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{service.type.name}</span>
                <Badge className={statusColors[service.status]}>
                  {service.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {service.description} - {service.quantity}
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Requested: {formatDate(service.requestedDate)}
                </span>
                {service.vendor && (
                  <span>Vendor: {service.vendor.name}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-semibold">
              {formatPrice(service.quotedPrice, service.currency)}
            </span>
            <div className="flex gap-1">
              <Link
                href={`/services/${service.id}`}
                className="rounded p-1 hover:bg-muted"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
              </Link>
              <button className="rounded p-1 hover:bg-muted">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="rounded p-1 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
