'use client';

import { useEffect, useState } from 'react';
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
  Edit,
  MoreHorizontal,
  Building2,
  DollarSign,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { api, ServiceOrder } from '@/lib/api';

interface ServiceData {
  id: string;
  type: string;
  typeName: string;
  icon: any;
  reference: string;
  portCall: {
    id: string;
    reference: string;
    vessel: string;
    port: string;
    eta: Date;
  };
  vendor: {
    id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
  } | null;
  status: string;
  quantity: string;
  specifications: string;
  scheduledDate: Date;
  deliveryLocation: string;
  price: number;
  currency: string;
  pricePerUnit: number;
  unit: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  user: string;
}

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
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchService() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getServiceOrder(params.id);
        const data = response.data;

        setService({
          id: data.id,
          type: data.service_type?.category || 'service',
          typeName: data.service_type?.name || 'Service',
          icon: Fuel,
          reference: `SVC-${data.id.substring(0, 8)}`,
          portCall: {
            id: data.port_call_id,
            reference: `PC-${data.port_call_id.substring(0, 8)}`,
            vessel: 'Vessel',
            port: 'Port',
            eta: data.requested_date ? new Date(data.requested_date) : new Date(),
          },
          vendor: data.vendor ? {
            id: data.vendor.id,
            name: data.vendor.name,
            contact: '',
            email: '',
            phone: '',
          } : null,
          status: data.status,
          quantity: `${data.quantity || 0} ${data.unit || 'units'}`,
          specifications: JSON.stringify(data.specifications || {}),
          scheduledDate: data.confirmed_date ? new Date(data.confirmed_date) : new Date(),
          deliveryLocation: '',
          price: data.final_price || data.quoted_price || 0,
          currency: data.currency,
          pricePerUnit: data.quantity ? (data.final_price || data.quoted_price || 0) / data.quantity : 0,
          unit: data.unit || 'unit',
          notes: data.description || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        });

        // Create a simple timeline from the service data
        setTimeline([
          {
            id: '1',
            type: 'created',
            title: 'Service created',
            description: `Service order created`,
            timestamp: new Date(data.created_at),
            user: data.created_by,
          },
        ]);
      } catch (err) {
        console.error('Failed to fetch service:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'Service not found'}</p>
        <Link href="/services">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </Link>
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Vendor
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
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
              <Link
                href={`/vendors/${service.vendor.id}`}
                className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary">{service.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{service.vendor.contact}</p>
                </div>
              </Link>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">{service.vendor.email}</p>
                <p className="text-muted-foreground">{service.vendor.phone}</p>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Quote
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
