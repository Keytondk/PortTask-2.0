'use client';

import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Star,
} from 'lucide-react';

export function PerformanceMetrics() {
  const metrics = [
    {
      label: 'Open RFQs',
      value: 8,
      change: '+3 this week',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active Orders',
      value: 12,
      change: '4 in progress',
      changeType: 'neutral',
      icon: CheckCircle,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      label: 'Monthly Revenue',
      value: '$45,250',
      change: '+12% vs last month',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Win Rate',
      value: '68%',
      change: '+5% improvement',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {metric.value}
            </p>
            <p className="text-sm text-slate-500 mt-1">{metric.label}</p>
            <p
              className={`text-xs mt-2 ${
                metric.changeType === 'positive'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500'
              }`}
            >
              {metric.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
