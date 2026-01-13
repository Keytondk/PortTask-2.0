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
  Search,
  Fuel,
  Droplets,
  Trash2,
  Wrench,
  Package,
  Users,
  ChevronRight,
  Filter,
  Calendar,
  Ship,
} from 'lucide-react';

const serviceTypes = [
  { id: 'bunker', name: 'Bunker Supply', icon: Fuel },
  { id: 'water', name: 'Fresh Water', icon: Droplets },
  { id: 'waste', name: 'Waste Disposal', icon: Trash2 },
  { id: 'repairs', name: 'Repairs', icon: Wrench },
  { id: 'provisions', name: 'Provisions', icon: Package },
  { id: 'crew', name: 'Crew Services', icon: Users },
];

const services = [
  {
    id: '1',
    type: 'bunker',
    typeName: 'Bunker Supply',
    icon: Fuel,
    portCall: { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
    vendor: { id: '1', name: 'Marine Fuel Solutions' },
    status: 'confirmed',
    quantity: '500 MT VLSFO',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    price: 325000,
    currency: 'USD',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'water',
    typeName: 'Fresh Water Supply',
    icon: Droplets,
    portCall: { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
    vendor: null,
    status: 'requested',
    quantity: '200 MT',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    price: null,
    currency: 'USD',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'provisions',
    typeName: 'Provisions Supply',
    icon: Package,
    portCall: { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
    vendor: { id: '2', name: 'Port Services International' },
    status: 'in_progress',
    quantity: '1 Lot (25 crew)',
    scheduledDate: new Date(),
    price: 8500,
    currency: 'EUR',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'waste',
    typeName: 'Waste Disposal',
    icon: Trash2,
    portCall: { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
    vendor: { id: '2', name: 'Port Services International' },
    status: 'completed',
    quantity: '15 CBM',
    scheduledDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
    price: 2200,
    currency: 'EUR',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'repairs',
    typeName: 'Engine Maintenance',
    icon: Wrench,
    portCall: { id: '3', reference: 'PC-25-0003', vessel: 'MT Gulf Trader', port: 'Dubai' },
    vendor: { id: '3', name: 'Gulf Marine Services' },
    status: 'quoted',
    quantity: 'Scheduled maintenance',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price: 45000,
    currency: 'USD',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.portCall.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.portCall.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || service.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeServices = filteredServices.filter((s) => !['completed', 'cancelled'].includes(s.status));
  const completedServices = filteredServices.filter((s) => ['completed', 'cancelled'].includes(s.status));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage all port services and operations</p>
        </div>
      </div>

      {/* Service type quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {serviceTypes.map((type) => (
          <Button
            key={type.id}
            variant={typeFilter === type.id ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0"
            onClick={() => setTypeFilter(typeFilter === type.id ? 'all' : type.id)}
          >
            <type.icon className="mr-2 h-4 w-4" />
            {type.name}
          </Button>
        ))}
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services, vessels..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="rfq_sent">RFQ Sent</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs for active/completed */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeServices.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedServices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {activeServices.length > 0 ? (
            activeServices.map((service) => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
                  {/* Mobile layout */}
                  <div className="flex items-center justify-between md:hidden">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <service.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{service.typeName}</p>
                        <p className="text-sm text-muted-foreground">{service.portCall.vessel}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-3 flex items-center justify-between md:hidden">
                    <span className="text-sm font-medium">
                      {formatPrice(service.price, service.currency)}
                    </span>
                    <Badge className={statusConfig[service.status]?.color}>
                      {statusConfig[service.status]?.label}
                    </Badge>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden items-center justify-between md:flex">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{service.typeName}</span>
                          <Badge variant="outline" className="font-normal">
                            {service.portCall.reference}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ship className="h-4 w-4" />
                            {service.portCall.vessel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(service.scheduledDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatPrice(service.price, service.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {service.vendor?.name || 'Pending vendor'}
                        </p>
                      </div>
                      <Badge className={statusConfig[service.status]?.color}>
                        {statusConfig[service.status]?.label}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Wrench className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No active services</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All services have been completed or cancelled
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedServices.length > 0 ? (
            completedServices.map((service) => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <service.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{service.typeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.portCall.vessel} · {formatDate(service.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {formatPrice(service.price, service.currency)}
                      </span>
                      <Badge className={statusConfig[service.status]?.color}>
                        {statusConfig[service.status]?.label}
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
                  <Wrench className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No completed services</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completed services will appear here
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
