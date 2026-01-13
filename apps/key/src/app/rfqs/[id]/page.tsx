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
  FileText,
  Ship,
  MapPin,
  Calendar,
  Edit,
  Send,
  CheckCircle,
  Building2,
  DollarSign,
  Clock,
  Users,
  Star,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { api, RFQ, Quote } from '@/lib/api';

interface RFQData {
  id: string;
  reference: string;
  title: string;
  description: string;
  service: {
    type: string;
    quantity: string;
    specifications: string;
  };
  portCall: {
    id: string;
    reference: string;
    vessel: string;
    port: string;
    eta: Date;
  };
  status: string;
  vendorsInvited: number;
  deadline: Date;
  createdAt: Date;
  createdBy: string;
  notes: string;
}

interface QuoteData {
  id: string;
  vendor: { id: string; name: string; rating: number };
  price: number;
  pricePerUnit: number;
  currency: string;
  deliveryDate: Date;
  validUntil: Date;
  notes: string | null;
  submittedAt: Date;
  status: string;
  isLowest: boolean;
}

interface InvitedVendor {
  id: string;
  name: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  quotes_received: {
    label: 'Quotes Received',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  },
  awarded: {
    label: 'Awarded',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  quoted: {
    label: 'Quoted',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  declined: {
    label: 'Declined',
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
    maximumFractionDigits: 0,
  }).format(price);
}

export default function RFQDetailPage() {
  const params = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQData | null>(null);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [invitedVendors, setInvitedVendors] = useState<InvitedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRFQ() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getRFQ(params.id);
        const data = response.data;

        setRfq({
          id: data.id,
          reference: data.reference,
          title: `${data.service_type?.name || 'Service'} Request`,
          description: data.description || '',
          service: {
            type: data.service_type?.name || 'Service',
            quantity: `${data.quantity || 0} ${data.unit || 'units'}`,
            specifications: JSON.stringify(data.specifications || {}),
          },
          portCall: {
            id: data.port_call_id,
            reference: `PC-${data.port_call_id.substring(0, 8)}`,
            vessel: 'Vessel',
            port: 'Port',
            eta: data.delivery_date ? new Date(data.delivery_date) : new Date(),
          },
          status: data.status === 'open' ? 'quotes_received' : data.status,
          vendorsInvited: data.invited_vendors?.length || 0,
          deadline: new Date(data.deadline),
          createdAt: new Date(data.created_at),
          createdBy: data.created_by,
          notes: data.description || '',
        });

        // Fetch quotes
        if (data.quotes) {
          const lowestPrice = Math.min(...data.quotes.map((q: Quote) => q.total_price));
          setQuotes(data.quotes.map((q: Quote) => ({
            id: q.id,
            vendor: { id: q.vendor_id, name: q.vendor?.name || 'Vendor', rating: 4.5 },
            price: q.total_price,
            pricePerUnit: q.unit_price,
            currency: q.currency,
            deliveryDate: q.delivery_date ? new Date(q.delivery_date) : new Date(),
            validUntil: q.valid_until ? new Date(q.valid_until) : new Date(),
            notes: q.notes || null,
            submittedAt: new Date(q.submitted_at),
            status: q.status,
            isLowest: q.total_price === lowestPrice,
          })));
        }

        // Transform invited vendors
        if (data.invited_vendors) {
          setInvitedVendors(data.invited_vendors.map((id: string, index: number) => ({
            id,
            name: `Vendor ${index + 1}`,
            status: 'pending',
          })));
        }
      } catch (err) {
        console.error('Failed to fetch RFQ:', err);
        setError('Failed to load RFQ details');
      } finally {
        setLoading(false);
      }
    }

    fetchRFQ();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'RFQ not found'}</p>
        <Link href="/rfqs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFQs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/rfqs"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RFQs
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{rfq.title}</h1>
                <Badge className={statusConfig[rfq.status]?.color}>
                  {statusConfig[rfq.status]?.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{rfq.reference}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quotes */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Quotes ({quotes.length})</h2>
              <span className="text-sm text-muted-foreground">
                Deadline: {formatDateTime(rfq.deadline)}
              </span>
            </div>
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`rounded-xl border p-4 transition-colors hover:bg-muted/30 ${
                    quote.isLowest ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{quote.vendor.name}</p>
                          {quote.isLowest && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              Lowest
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{quote.vendor.rating}</span>
                          <span>·</span>
                          <span>Submitted {formatDateTime(quote.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatPrice(quote.price, quote.currency)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(quote.pricePerUnit, quote.currency)}/MT
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Delivery: {formatDate(quote.deliveryDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Valid until: {formatDate(quote.validUntil)}
                    </span>
                  </div>
                  {quote.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{quote.notes}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Accept Quote</Button>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Requirements */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Requirements</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">{rfq.service.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">{rfq.service.quantity}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Specifications</p>
                <p className="font-medium">{rfq.service.specifications}</p>
              </div>
            </div>
            {rfq.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{rfq.notes}</p>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Port call info */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Port Call</h3>
            <Link
              href={`/port-calls/${rfq.portCall.id}`}
              className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium group-hover:text-primary">{rfq.portCall.vessel}</p>
                <p className="text-sm text-muted-foreground">{rfq.portCall.reference}</p>
              </div>
            </Link>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{rfq.portCall.port}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>ETA: {formatDateTime(rfq.portCall.eta)}</span>
              </div>
            </div>
          </Card>

          {/* Invited vendors */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Invited Vendors</h3>
              <span className="text-sm text-muted-foreground">{invitedVendors.length} vendors</span>
            </div>
            <div className="space-y-2">
              {invitedVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{vendor.name}</span>
                  </div>
                  <Badge className={statusConfig[vendor.status]?.color}>
                    {statusConfig[vendor.status]?.label}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              <Users className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </Card>

          {/* Info */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(rfq.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span>{rfq.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span>{formatDateTime(rfq.deadline)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
