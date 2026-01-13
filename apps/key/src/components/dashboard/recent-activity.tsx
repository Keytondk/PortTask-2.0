'use client';

import {
  Anchor,
  FileText,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

// Mock data - will be replaced with API call
const activities = [
  {
    id: '1',
    type: 'quote_received',
    icon: FileText,
    title: 'New Quote Received',
    description: 'Marine Fuel Solutions submitted quote for RFQ-25-0001',
    time: '15 minutes ago',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: '2',
    type: 'service_completed',
    icon: CheckCircle,
    title: 'Service Completed',
    description: 'Waste disposal completed for MV Atlantic Voyager',
    time: '2 hours ago',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: '3',
    type: 'port_call_created',
    icon: Anchor,
    title: 'Port Call Scheduled',
    description: 'New port call PC-25-0004 created for Houston',
    time: '4 hours ago',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: '4',
    type: 'incident',
    icon: AlertTriangle,
    title: 'Incident Reported',
    description: 'Delay in bunker delivery at Rotterdam',
    time: '6 hours ago',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: '5',
    type: 'message',
    icon: MessageSquare,
    title: 'New Message',
    description: 'Agent replied regarding berth confirmation',
    time: '8 hours ago',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${activity.bgColor}`}
          >
            <activity.icon className={`h-4 w-4 ${activity.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activity.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
