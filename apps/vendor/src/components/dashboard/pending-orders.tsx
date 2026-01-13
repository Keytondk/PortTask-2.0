'use client';

import Link from 'next/link';
import { ClipboardList, Clock, ArrowRight, Ship, Play } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const pendingOrders = [
  {
    id: '1',
    reference: 'SO-2024-001',
    serviceType: 'Bunkering',
    vessel: 'MV Pacific Star',
    port: 'Singapore',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    price: 125000,
    currency: 'USD',
  },
  {
    id: '2',
    reference: 'SO-2024-002',
    serviceType: 'Provisions Supply',
    vessel: 'MV Atlantic Voyager',
    port: 'Rotterdam',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    price: 15000,
    currency: 'EUR',
  },
  {
    id: '3',
    reference: 'SO-2024-003',
    serviceType: 'Fresh Water',
    vessel: 'MV Indian Ocean',
    port: 'Dubai',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    price: 3000,
    currency: 'USD',
  },
];

const statusColors = {
  confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  completed: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400',
};

export function PendingOrders() {
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
            Pending Orders
          </h2>
          <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full flex items-center justify-center">
            {pendingOrders.length}
          </span>
        </div>
        <Link
          href="/orders"
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {pendingOrders.map((order) => (
          <div key={order.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {order.serviceType}
                  </h3>
                  <span
                    className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      statusColors[order.status as keyof typeof statusColors]
                    )}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {order.vessel} - {order.port}
                </p>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(order.price, order.currency)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>{order.reference}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(order.scheduledDate), 'MMM d, HH:mm')}
                </span>
              </div>

              {order.status === 'confirmed' && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Play className="w-3.5 h-3.5" />
                  Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pendingOrders.length === 0 && (
        <div className="p-8 text-center">
          <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No pending orders</p>
        </div>
      )}
    </div>
  );
}
