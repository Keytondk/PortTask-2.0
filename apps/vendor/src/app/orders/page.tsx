'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  ClipboardList,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Ship,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const orders = [
  {
    id: '1',
    reference: 'ORD-2024-001',
    serviceType: 'Bunkering',
    description: '500 MT VLSFO delivery',
    port: 'Singapore',
    vessel: 'MV Pacific Star',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 125000,
    currency: 'USD',
    status: 'confirmed',
    client: 'Pacific Shipping Co.',
  },
  {
    id: '2',
    reference: 'ORD-2024-002',
    serviceType: 'Provisions Supply',
    description: 'Fresh stores for 25 crew members',
    port: 'Rotterdam',
    vessel: 'MV Atlantic Voyager',
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 15000,
    currency: 'EUR',
    status: 'in_progress',
    client: 'Atlantic Maritime',
  },
  {
    id: '3',
    reference: 'ORD-2024-003',
    serviceType: 'Waste Disposal',
    description: 'Sludge and oily waste removal',
    port: 'Hamburg',
    vessel: 'MV Northern Wind',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 5000,
    currency: 'EUR',
    status: 'completed',
    client: 'Nordic Shipping AS',
  },
  {
    id: '4',
    reference: 'ORD-2024-004',
    serviceType: 'Bunkering',
    description: '300 MT MGO delivery',
    port: 'Dubai',
    vessel: 'MV Indian Ocean',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 95000,
    currency: 'USD',
    status: 'pending',
    client: 'Gulf Maritime LLC',
  },
  {
    id: '5',
    reference: 'ORD-2024-005',
    serviceType: 'Technical Supplies',
    description: 'Engine spare parts delivery',
    port: 'Singapore',
    vessel: 'MV Eastern Star',
    scheduledDate: new Date().toISOString(),
    amount: 28000,
    currency: 'USD',
    status: 'in_progress',
    client: 'Eastern Fleet Management',
  },
];

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Loader2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertCircle,
  },
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.port.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const activeOrders = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'in_progress'
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Orders
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your service orders and track deliveries
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Pending Acceptance
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {pendingOrders.length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              In Progress
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
              {activeOrders.length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">
              Completed (This Month)
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
              {completedOrders.length}
            </p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total Value
            </p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              ${(orders.reduce((sum, o) => sum + (o.currency === 'USD' ? o.amount : o.amount * 1.1), 0) / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by service, vessel, port, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const isToday =
                new Date(order.scheduledDate).toDateString() ===
                new Date().toDateString();

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0',
                      order.status === 'in_progress'
                        ? 'bg-purple-100 dark:bg-purple-900/20'
                        : order.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-900/20'
                          : order.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : 'bg-blue-100 dark:bg-blue-900/20'
                    )}
                  >
                    <Package
                      className={clsx(
                        'w-7 h-7',
                        order.status === 'in_progress'
                          ? 'text-purple-600 dark:text-purple-400'
                          : order.status === 'pending'
                            ? 'text-amber-600 dark:text-amber-400'
                            : order.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-blue-600 dark:text-blue-400'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {order.serviceType}
                      </h3>
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1',
                          status.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {isToday && order.status !== 'completed' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-1">
                      {order.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{order.reference}</span>
                      <span className="flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5" />
                        {order.vessel}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {order.port}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span>{order.client}</span>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(order.scheduledDate), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No orders found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </VendorShell>
  );
}
