'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Badge,
  Separator,
} from '@navo/ui';
import {
  ArrowLeft,
  Fuel,
  Ship,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  Download,
} from 'lucide-react';

// Mock data
const serviceData = {
  id: '1',
  type: 'bunker',
  typeName: 'Bunker Supply',
  icon: Fuel,
  reference: 'SVC-25-0001',
  portCall: {
    id: '1',
    reference: 'PC-25-0001',
    vessel: 'MV Pacific Star',
    port: 'Singapore',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  vendor: {
    id: '1',
    name: 'Marine Fuel Solutions',
    contact: 'John Smith',
    email: 'john@marinefuel.com',
    phone: '+65 9123 4567',
  },
  status: 'confirmed',
  quantity: '500 MT VLSFO',
  specifications: 'VLSFO 0.5% Sulfur, ISO 8217:2017',
  scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  deliveryLocation: 'Western Anchorage',
  price: 325000,
  currency: 'USD',
  pricePerUnit: 650,
  unit: 'MT',
  notes: 'Delivery via barge. Vessel to provide 24hr notice before arrival.',
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
};

const timeline = [
  {
    id: '1',
    type: 'created',
    title: 'Service requested',
    description: 'Bunker supply service created',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    user: 'Operations Team',
  },
  {
    id: '2',
    type: 'rfq',
    title: 'RFQ sent',
    description: 'RFQ sent to 3 vendors',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    user: 'System',
  },
  {
    id: '3',
    type: 'quote',
    title: 'Quote received',
    description: 'Marine Fuel Solutions submitted quote for $325,000',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    user: 'Marine Fuel Solutions',
  },
  {
    id: '4',
    type: 'confirmed',
    title: 'Service confirmed',
    description: 'Quote accepted and service confirmed',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    user: 'Operations Team',
  },
];

const documents = [
  {
    id: '1',
    name: 'Quote - Marine Fuel Solutions',
    type: 'Quote',
    size: '245 KB',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Service Confirmation',
    type: 'Confirmation',
    size: '128 KB',
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  requested: {
    label: 'Requested',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  rfq_sent: {
    label: 'RFQ Sent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  quoted: {
    label: 'Quoted',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
  completed: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
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

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

export default function ServiceDetailPage() {
  const params = useParams();
  const service = serviceData;
  const Icon = service.icon;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/services"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{service.typeName}</h1>
                <Badge className={statusConfig[service.status]?.color}>
                  {statusConfig[service.status]?.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {service.reference} · {service.portCall.vessel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Service details */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Service Details</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{service.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specifications</p>
                  <p className="font-medium">{service.specifications}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Location</p>
                  <p className="font-medium">{service.deliveryLocation}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">{formatDateTime(service.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="text-xl font-bold">{formatPrice(service.price, service.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="font-medium">
                    {formatPrice(service.pricePerUnit, service.currency)} / {service.unit}
                  </p>
                </div>
              </div>
            </div>
            {service.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{service.notes}</p>
                </div>
              </>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Activity Timeline</h2>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {event.type === 'confirmed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="absolute top-8 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)} · {event.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Documents</h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} · {doc.size} · {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Port call info */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Port Call</h3>
            <Link
              href={`/port-calls/${service.portCall.id}`}
              className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium group-hover:text-primary">{service.portCall.vessel}</p>
                <p className="text-sm text-muted-foreground">{service.portCall.reference}</p>
              </div>
            </Link>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{service.portCall.port}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>ETA: {formatDateTime(service.portCall.eta)}</span>
              </div>
            </div>
          </Card>

          {/* Vendor info */}
          {service.vendor && (
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Vendor</h3>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{service.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{service.vendor.contact}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">{service.vendor.email}</p>
                <p className="text-muted-foreground">{service.vendor.phone}</p>
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(service.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(service.updatedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total Cost</span>
                <span className="text-lg">{formatPrice(service.price, service.currency)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
