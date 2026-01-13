'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@navo/ui';
import {
  Plus,
  Search,
  FileText,
  Send,
  Clock,
  CheckCircle,
  ChevronRight,
  Ship,
  Calendar,
  Users,
} from 'lucide-react';

const rfqs = [
  {
    id: '1',
    reference: 'RFQ-25-0001',
    title: 'Bunker Supply - Singapore',
    service: { type: 'Bunker Supply', quantity: '500 MT VLSFO' },
    portCall: { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
    status: 'quotes_received',
    vendorsInvited: 5,
    quotesReceived: 3,
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lowestQuote: 325000,
    currency: 'USD',
  },
  {
    id: '2',
    reference: 'RFQ-25-0002',
    title: 'Fresh Water Supply - Singapore',
    service: { type: 'Fresh Water', quantity: '200 MT' },
    portCall: { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
    status: 'sent',
    vendorsInvited: 3,
    quotesReceived: 0,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lowestQuote: null,
    currency: 'USD',
  },
  {
    id: '3',
    reference: 'RFQ-25-0003',
    title: 'Engine Maintenance - Dubai',
    service: { type: 'Repairs', quantity: 'Scheduled maintenance' },
    portCall: { id: '3', reference: 'PC-25-0003', vessel: 'MT Gulf Trader', port: 'Dubai' },
    status: 'quotes_received',
    vendorsInvited: 4,
    quotesReceived: 2,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lowestQuote: 42000,
    currency: 'USD',
  },
  {
    id: '4',
    reference: 'RFQ-25-0004',
    title: 'Provisions - Rotterdam',
    service: { type: 'Provisions', quantity: '1 Lot (25 crew)' },
    portCall: { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
    status: 'awarded',
    vendorsInvited: 3,
    quotesReceived: 3,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lowestQuote: 8500,
    currency: 'EUR',
  },
  {
    id: '5',
    reference: 'RFQ-24-0089',
    title: 'Waste Disposal - Rotterdam',
    service: { type: 'Waste Disposal', quantity: '15 CBM' },
    portCall: { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
    status: 'closed',
    vendorsInvited: 2,
    quotesReceived: 2,
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lowestQuote: 2200,
    currency: 'EUR',
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: FileText,
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    icon: Send,
  },
  quotes_received: {
    label: 'Quotes Received',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    icon: Clock,
  },
  awarded: {
    label: 'Awarded',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    icon: CheckCircle,
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    icon: FileText,
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function getDeadlineStatus(deadline: Date): { text: string; color: string } {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 0) return { text: 'Expired', color: 'text-red-600' };
  if (hours < 24) return { text: 'Due today', color: 'text-amber-600' };
  if (hours < 48) return { text: 'Due tomorrow', color: 'text-amber-600' };
  return { text: formatDate(deadline), color: 'text-muted-foreground' };
}

export default function RFQsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesSearch =
      rfq.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.portCall.vessel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRFQs = filteredRFQs.filter((r) => ['draft', 'sent', 'quotes_received'].includes(r.status));
  const closedRFQs = filteredRFQs.filter((r) => ['awarded', 'closed', 'cancelled'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RFQs</h1>
          <p className="text-muted-foreground">Request for Quotes management</p>
        </div>
        <Link href="/rfqs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create RFQ
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search RFQs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="quotes_received">Quotes Received</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeRFQs.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({closedRFQs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {activeRFQs.length > 0 ? (
            activeRFQs.map((rfq) => {
              const deadline = getDeadlineStatus(rfq.deadline);
              return (
                <Link key={rfq.id} href={`/rfqs/${rfq.id}`}>
                  <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
                    {/* Mobile layout */}
                    <div className="md:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{rfq.title}</p>
                            <p className="text-sm text-muted-foreground">{rfq.reference}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{rfq.quotesReceived}/{rfq.vendorsInvited} quotes</span>
                        </div>
                        <Badge className={statusConfig[rfq.status]?.color}>
                          {statusConfig[rfq.status]?.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden items-center justify-between md:flex">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{rfq.title}</span>
                            <Badge variant="outline" className="font-normal">
                              {rfq.reference}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Ship className="h-4 w-4" />
                              {rfq.portCall.vessel}
                            </span>
                            <span>{rfq.service.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Quotes</p>
                          <p className="font-semibold">{rfq.quotesReceived}/{rfq.vendorsInvited}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Lowest</p>
                          <p className="font-semibold">{formatPrice(rfq.lowestQuote, rfq.currency)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Deadline</p>
                          <p className={`font-medium ${deadline.color}`}>{deadline.text}</p>
                        </div>
                        <Badge className={statusConfig[rfq.status]?.color}>
                          {statusConfig[rfq.status]?.label}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No active RFQs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new RFQ to start collecting quotes
                </p>
                <Link href="/rfqs/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create RFQ
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-3">
          {closedRFQs.length > 0 ? (
            closedRFQs.map((rfq) => (
              <Link key={rfq.id} href={`/rfqs/${rfq.id}`}>
                <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{rfq.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {rfq.reference} · {rfq.portCall.vessel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {formatPrice(rfq.lowestQuote, rfq.currency)}
                      </span>
                      <Badge className={statusConfig[rfq.status]?.color}>
                        {statusConfig[rfq.status]?.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No closed RFQs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Closed RFQs will appear here
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
