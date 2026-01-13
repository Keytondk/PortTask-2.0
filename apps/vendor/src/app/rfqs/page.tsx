'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  FileText,
  Clock,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  Ship,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const rfqs = [
  {
    id: '1',
    reference: 'RFQ-2024-001',
    serviceType: 'Bunkering',
    description: '500 MT VLSFO required',
    port: 'Singapore',
    vessel: 'MV Pacific Star',
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 125000,
    currency: 'USD',
    status: 'open',
    invited: true,
    hasQuoted: false,
    quotesCount: 3,
  },
  {
    id: '2',
    reference: 'RFQ-2024-002',
    serviceType: 'Provisions Supply',
    description: 'Fresh stores for 25 crew members',
    port: 'Rotterdam',
    vessel: 'MV Atlantic Voyager',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 15000,
    currency: 'EUR',
    status: 'open',
    invited: true,
    hasQuoted: true,
    quotesCount: 5,
  },
  {
    id: '3',
    reference: 'RFQ-2024-003',
    serviceType: 'Waste Disposal',
    description: 'Sludge and oily waste removal',
    port: 'Hamburg',
    vessel: 'MV Northern Wind',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 5000,
    currency: 'EUR',
    status: 'open',
    invited: true,
    hasQuoted: false,
    quotesCount: 2,
  },
  {
    id: '4',
    reference: 'RFQ-2024-004',
    serviceType: 'Bunkering',
    description: '300 MT MGO delivery',
    port: 'Dubai',
    vessel: 'MV Indian Ocean',
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 95000,
    currency: 'USD',
    status: 'closed',
    invited: true,
    hasQuoted: true,
    quotesCount: 6,
  },
];

export default function RFQsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesSearch =
      !searchQuery ||
      rfq.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.port.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            RFQs
          </h1>
          <p className="text-slate-500 mt-1">
            View and respond to Request for Quotes
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Awaiting Response
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {rfqs.filter((r) => r.status === 'open' && !r.hasQuoted).length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">
              Quotes Submitted
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
              {rfqs.filter((r) => r.hasQuoted).length}
            </p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
            <p className="text-sm text-slate-600 dark:text-slate-400">Closed</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              {rfqs.filter((r) => r.status === 'closed').length}
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
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="awarded">Awarded</option>
            </select>
          </div>
        </div>

        {/* RFQs List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredRFQs.map((rfq) => {
              const isUrgent =
                rfq.status === 'open' &&
                new Date(rfq.deadline).getTime() - Date.now() <
                  12 * 60 * 60 * 1000;
              const isExpired =
                rfq.status === 'open' && new Date(rfq.deadline) < new Date();

              return (
                <Link
                  key={rfq.id}
                  href={`/rfqs/${rfq.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0',
                      rfq.status === 'open' && !rfq.hasQuoted
                        ? 'bg-amber-100 dark:bg-amber-900/20'
                        : rfq.hasQuoted
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-slate-100 dark:bg-slate-700'
                    )}
                  >
                    <FileText
                      className={clsx(
                        'w-7 h-7',
                        rfq.status === 'open' && !rfq.hasQuoted
                          ? 'text-amber-600 dark:text-amber-400'
                          : rfq.hasQuoted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {rfq.serviceType}
                      </h3>
                      {rfq.hasQuoted && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Quoted
                        </span>
                      )}
                      {isUrgent && !isExpired && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Urgent
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-1">
                      {rfq.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{rfq.reference}</span>
                      <span className="flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5" />
                        {rfq.vessel}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {rfq.port}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(rfq.estimatedValue, rfq.currency)}
                    </p>
                    <p
                      className={clsx(
                        'text-sm mt-1 flex items-center gap-1 justify-end',
                        isUrgent && !isExpired
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {isExpired
                        ? 'Expired'
                        : formatDistanceToNow(new Date(rfq.deadline), {
                            addSuffix: true,
                          })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {rfq.quotesCount} quotes
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {filteredRFQs.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No RFQs found
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
