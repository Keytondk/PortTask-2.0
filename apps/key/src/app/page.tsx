import { Suspense } from 'react';
import { Card, Skeleton } from '@navo/ui';
import {
  Anchor,
  Ship,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { UpcomingPortCalls } from '@/components/dashboard/upcoming-port-calls';
import { ActiveServices } from '@/components/dashboard/active-services';
import { RecentActivity } from '@/components/dashboard/recent-activity';

const stats = [
  {
    name: 'Active Port Calls',
    value: '12',
    change: '+2',
    changeLabel: 'from last week',
    trend: 'up',
    icon: Anchor,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'Vessels in Fleet',
    value: '24',
    change: '3',
    changeLabel: 'en route',
    trend: 'neutral',
    icon: Ship,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    name: 'Pending Services',
    value: '8',
    change: '3',
    changeLabel: 'urgent',
    trend: 'warning',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    name: 'Open Incidents',
    value: '2',
    change: '-1',
    changeLabel: 'from yesterday',
    trend: 'down',
    icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
];

function StatsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function CardLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 rounded-xl border p-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">
          Overview of your maritime operations
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {stat.trend === 'up' && (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                      {stat.change}
                    </span>
                  )}
                  {stat.trend === 'down' && (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                      {stat.change}
                    </span>
                  )}
                  {stat.trend === 'warning' && (
                    <span className="text-amber-600 dark:text-amber-400">{stat.change}</span>
                  )}
                  {stat.trend === 'neutral' && (
                    <span className="text-muted-foreground">{stat.change}</span>
                  )}
                  <span className="text-muted-foreground">{stat.changeLabel}</span>
                </div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming port calls */}
        <div className="lg:col-span-2">
          <Card className="p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Port Calls</h2>
              <Link
                href="/port-calls"
                className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <Suspense fallback={<CardLoading />}>
              <UpcomingPortCalls />
            </Suspense>
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <Card className="p-5 lg:p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <Suspense fallback={<CardLoading />}>
              <RecentActivity />
            </Suspense>
          </Card>
        </div>
      </div>

      {/* Active services */}
      <Card className="p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Services</h2>
          <Link
            href="/services"
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <Suspense fallback={<CardLoading />}>
          <ActiveServices />
        </Suspense>
      </Card>
    </div>
  );
}
