'use client';

import { Ship, Anchor, Navigation, Clock } from 'lucide-react';

export function FleetStatus() {
  // Mock data - in production, this would come from an API
  const stats = [
    {
      label: 'Active Vessels',
      value: 12,
      icon: Ship,
      color: 'blue',
      change: '+2',
    },
    {
      label: 'At Port',
      value: 4,
      icon: Anchor,
      color: 'green',
      change: '0',
    },
    {
      label: 'En Route',
      value: 8,
      icon: Navigation,
      color: 'amber',
      change: '+1',
    },
    {
      label: 'Pending ETA',
      value: 3,
      icon: Clock,
      color: 'slate',
      change: '-1',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {stat.change !== '0' && (
                <span
                  className={`text-sm font-medium ${
                    stat.change.startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
