'use client';

import {
  Ship,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Anchor,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const activities = [
  {
    id: '1',
    type: 'port_call_status',
    title: 'Port call status updated',
    description: 'MV Pacific Star arrived at Singapore',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    icon: Ship,
    iconColor: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: '2',
    type: 'service_completed',
    title: 'Service completed',
    description: 'Bunkering service for MV Pacific Star completed',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: CheckCircle,
    iconColor: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  },
  {
    id: '3',
    type: 'quote_received',
    title: 'New quote received',
    description: 'Harbor Tug Services submitted a quote for towage',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    icon: FileText,
    iconColor: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  },
  {
    id: '4',
    type: 'eta_update',
    title: 'ETA updated',
    description: 'MV Atlantic Voyager ETA to Rotterdam revised to March 15',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    icon: Clock,
    iconColor: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  },
  {
    id: '5',
    type: 'berth_confirmed',
    title: 'Berth confirmed',
    description: 'Berth assigned for MV Indian Ocean at Dubai - Terminal 3',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    icon: Anchor,
    iconColor: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',
  },
];

export function ActivityFeed() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </h2>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex gap-4">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    activity.iconColor
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No recent activity</p>
        </div>
      )}
    </div>
  );
}
