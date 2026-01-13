'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  Wrench,
  Clock,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Ship,
  MapPin,
  Calendar,
  Package,
  DollarSign,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const serviceOrders = [
  {
    id: '1',
    reference: 'SO-2024-001',
    serviceType: 'Bunkering',
    description: '500 MT VLSFO delivery',
    portCall: {
      id: 'pc-1',
      vessel: 'MV Pacific Star',
      port: 'Singapore',
    },
    vendor: 'Singapore Bunkers Pte Ltd',
    status: 'in_progress',
    requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    quotedPrice: 125000,
    currency: 'USD',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    reference: 'SO-2024-002',
    serviceType: 'Provisions Supply',
    description: 'Fresh stores for 25 crew - 30 days supply',
    portCall: {
      id: 'pc-1',
      vessel: 'MV Pacific Star',
      port: 'Singapore',
    },
    vendor: 'Fresh Marine Supplies',
    status: 'confirmed',
    requestedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    quotedPrice: 15000,
    currency: 'USD',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    reference: 'SO-2024-003',
    serviceType: 'Waste Disposal',
    description: 'Sludge and oily waste removal',
    portCall: {
      id: 'pc-2',
      vessel: 'MV Atlantic Voyager',
      port: 'Rotterdam',
    },
    vendor: null,
    status: 'rfq_sent',
    requestedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    quotedPrice: null,
    currency: 'EUR',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    reference: 'SO-2024-004',
    serviceType: 'Crew Change',
    description: '5 crew members sign-off, 5 sign-on',
    portCall: {
      id: 'pc-3',
      vessel: 'MV Northern Wind',
      port: 'Hamburg',
    },
    vendor: 'Maritime Agency GmbH',
    status: 'completed',
    requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    quotedPrice: 8500,
    finalPrice: 8200,
    currency: 'EUR',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    reference: 'SO-2024-005',
    serviceType: 'Technical Spares',
    description: 'Main engine spare parts - urgent',
    portCall: {
      id: 'pc-2',
      vessel: 'MV Atlantic Voyager',
      port: 'Rotterdam',
    },
    vendor: null,
    status: 'draft',
    requestedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    quotedPrice: null,
    currency: 'USD',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-700' },
  requested: { label: 'Requested', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  rfq_sent: { label: 'RFQ Sent', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/20' },
  quoted: { label: 'Quoted', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20' },
  in_progress: { label: 'In Progress', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/20' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
};

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredOrders = serviceOrders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.portCall.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.portCall.port.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number | null | undefined, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Stats
  const stats = {
    active: serviceOrders.filter((o) => ['confirmed', 'in_progress'].includes(o.status)).length,
    pending: serviceOrders.filter((o) => ['draft', 'requested', 'rfq_sent', 'quoted'].includes(o.status)).length,
    completed: serviceOrders.filter((o) => o.status === 'completed').length,
    totalValue: serviceOrders.reduce((sum, o) => sum + (o.quotedPrice || 0), 0),
  };

  return (
    <PortalShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Service Orders
          </h1>
          <p className="text-slate-500 mt-1">
            View and track all service orders across your fleet
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-cyan-600 dark:text-cyan-400">Active</p>
              <Wrench className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 mt-1">
              {stats.active}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-600 dark:text-amber-400">Pending</p>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {stats.pending}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
              {stats.completed}
            </p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Value</p>
              <DollarSign className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              ${(stats.totalValue / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by service, vessel, port, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="requested">Requested</option>
              <option value="rfq_sent">RFQ Sent</option>
              <option value="quoted">Quoted</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Service Orders List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status];

              return (
                <Link
                  key={order.id}
                  href={`/services/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      status.bgColor
                    )}
                  >
                    {order.status === 'completed' ? (
                      <CheckCircle2 className={clsx('w-6 h-6', status.color)} />
                    ) : order.status === 'in_progress' ? (
                      <Package className={clsx('w-6 h-6', status.color)} />
                    ) : (
                      <Wrench className={clsx('w-6 h-6', status.color)} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {order.serviceType}
                      </h3>
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          status.bgColor,
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-1">
                      {order.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{order.reference}</span>
                      <span className="flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5" />
                        {order.portCall.vessel}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {order.portCall.port}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right flex-shrink-0">
                    {order.quotedPrice && (
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(order.quotedPrice, order.currency)}
                      </p>
                    )}
                    {order.vendor && (
                      <p className="text-sm text-slate-500 mt-1 truncate max-w-[200px]">
                        {order.vendor}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(order.requestedDate), 'MMM d')}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No service orders found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
