'use client';

import { VendorShell } from '@/components/layout/vendor-shell';
import { ActiveRFQs } from '@/components/dashboard/active-rfqs';
import { PendingOrders } from '@/components/dashboard/pending-orders';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PerformanceMetrics } from '@/components/dashboard/performance-metrics';

export default function DashboardPage() {
  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your vendor operations
          </p>
        </div>

        {/* Metrics */}
        <PerformanceMetrics />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ActiveRFQs />
          <PendingOrders />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </VendorShell>
  );
}
