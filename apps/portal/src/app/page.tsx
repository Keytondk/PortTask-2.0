'use client';

import { PortalShell } from '@/components/layout/portal-shell';
import { FleetStatus } from '@/components/dashboard/fleet-status';
import { UpcomingCalls } from '@/components/dashboard/upcoming-calls';
import { PendingApprovals } from '@/components/dashboard/pending-approvals';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

export default function DashboardPage() {
  return (
    <PortalShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your fleet operations
          </p>
        </div>

        {/* Stats */}
        <FleetStatus />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UpcomingCalls />
            <ActivityFeed />
          </div>
          <div>
            <PendingApprovals />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
