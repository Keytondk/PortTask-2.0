'use client';

import {
  CheckCircle,
  Clock,
  FileText,
  Ship,
  Anchor,
  Package,
  User,
} from 'lucide-react';

// Mock data - will be replaced with API call
const timelineEvents = [
  {
    id: '1',
    type: 'created',
    title: 'Port call created',
    description: 'Created by John Operator',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: '2',
    type: 'service_added',
    title: 'Bunker supply requested',
    description: '500 MT VLSFO added',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: '3',
    type: 'agent_assigned',
    title: 'Agent assigned',
    description: 'Singapore Maritime Agency',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    icon: User,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: '4',
    type: 'berth_confirmed',
    title: 'Berth confirmed',
    description: 'Berth 12 at PSA Terminal',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: Anchor,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: '5',
    type: 'service_confirmed',
    title: 'Bunker supply confirmed',
    description: 'Marine Fuel Solutions - $325,000',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: '6',
    type: 'service_added',
    title: 'Fresh water requested',
    description: '200 MT potable water',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: '7',
    type: 'eta_updated',
    title: 'ETA updated',
    description: 'Vessel on schedule',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function PortCallTimeline({ portCallId }: { portCallId: string }) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 h-full w-px bg-border" />

      <div className="space-y-6">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div
              className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${event.bgColor}`}
            >
              <event.icon className={`h-4 w-4 ${event.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
