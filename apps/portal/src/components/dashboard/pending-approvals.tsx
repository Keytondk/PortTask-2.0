'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const pendingApprovals = [
  {
    id: '1',
    type: 'service_order',
    title: 'Bunkering Service',
    description: 'MV Pacific Star - 500 MT VLSFO',
    amount: 125000,
    currency: 'USD',
    vendor: 'Maritime Fuels Ltd',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
  },
  {
    id: '2',
    type: 'quote',
    title: 'Quote Approval',
    description: 'Towage Services - Rotterdam',
    amount: 8500,
    currency: 'EUR',
    vendor: 'Harbor Tug Services',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: '3',
    type: 'service_order',
    title: 'Provisions Supply',
    description: 'MV Atlantic Voyager - Fresh stores',
    amount: 15000,
    currency: 'USD',
    vendor: 'Ship Provisions Co',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
  },
];

const priorityColors = {
  high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  low: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400',
};

export function PendingApprovals() {
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
            Pending Approvals
          </h2>
          <span className="w-6 h-6 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-full flex items-center justify-center">
            {pendingApprovals.length}
          </span>
        </div>
        <Link
          href="/approvals"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {pendingApprovals.map((approval) => (
          <div key={approval.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {approval.title}
                  </h3>
                  <span
                    className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      priorityColors[approval.priority as keyof typeof priorityColors]
                    )}
                  >
                    {approval.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {approval.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-500">{approval.vendor}</p>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(approval.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(approval.amount, approval.currency)}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors">
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingApprovals.length === 0 && (
        <div className="p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-slate-500">All caught up! No pending approvals.</p>
        </div>
      )}
    </div>
  );
}
