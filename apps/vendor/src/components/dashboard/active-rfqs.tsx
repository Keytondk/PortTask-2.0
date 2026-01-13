'use client';

import Link from 'next/link';
import { FileText, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const activeRFQs = [
  {
    id: '1',
    reference: 'RFQ-2024-001',
    serviceType: 'Bunkering',
    port: 'Singapore',
    vessel: 'MV Pacific Star',
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 125000,
    currency: 'USD',
    priority: 'high',
  },
  {
    id: '2',
    reference: 'RFQ-2024-002',
    serviceType: 'Provisions Supply',
    port: 'Rotterdam',
    vessel: 'MV Atlantic Voyager',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 15000,
    currency: 'EUR',
    priority: 'medium',
  },
  {
    id: '3',
    reference: 'RFQ-2024-003',
    serviceType: 'Waste Disposal',
    port: 'Hamburg',
    vessel: 'MV Northern Wind',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    estimatedValue: 5000,
    currency: 'EUR',
    priority: 'low',
  },
];

const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  low: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400',
};

export function ActiveRFQs() {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Active RFQs
          </h2>
          <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-full flex items-center justify-center">
            {activeRFQs.length}
          </span>
        </div>
        <Link
          href="/rfqs"
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {activeRFQs.map((rfq) => {
          const isUrgent =
            new Date(rfq.deadline).getTime() - Date.now() < 12 * 60 * 60 * 1000;

          return (
            <Link
              key={rfq.id}
              href={`/rfqs/${rfq.id}`}
              className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {rfq.serviceType}
                    </h3>
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                        priorityColors[rfq.priority as keyof typeof priorityColors]
                      )}
                    >
                      {rfq.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {rfq.vessel} - {rfq.port}
                  </p>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(rfq.estimatedValue, rfq.currency)}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">{rfq.reference}</span>
                <span
                  className={clsx(
                    'flex items-center gap-1',
                    isUrgent
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500'
                  )}
                >
                  {isUrgent && <AlertCircle className="w-3.5 h-3.5" />}
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(rfq.deadline), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {activeRFQs.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No active RFQs</p>
        </div>
      )}
    </div>
  );
}
