'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Ship,
  MapPin,
  Calendar,
  Download,
  DollarSign,
  Clock,
  Anchor,
  Package,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { clsx } from 'clsx';
import { exportReportPDF } from '@/lib/pdf-export';

// Mock data
const fleetMetrics = {
  totalPortCalls: 47,
  portCallsChange: 12,
  avgTurnaroundTime: 2.4,
  turnaroundChange: -0.3,
  totalServiceCost: 1250000,
  costChange: 8,
  onTimeArrival: 94,
  onTimeChange: 2,
};

const portCallsByPort = [
  { port: 'Singapore', count: 15, percentage: 32 },
  { port: 'Rotterdam', count: 12, percentage: 26 },
  { port: 'Shanghai', count: 8, percentage: 17 },
  { port: 'Hamburg', count: 7, percentage: 15 },
  { port: 'Dubai', count: 5, percentage: 10 },
];

const serviceBreakdown = [
  { service: 'Bunkering', amount: 650000, percentage: 52 },
  { service: 'Provisions', amount: 180000, percentage: 14 },
  { service: 'Crew Change', amount: 150000, percentage: 12 },
  { service: 'Technical', amount: 120000, percentage: 10 },
  { service: 'Waste Disposal', amount: 80000, percentage: 6 },
  { service: 'Other', amount: 70000, percentage: 6 },
];

const monthlyTrend = [
  { month: 'Jul', portCalls: 8, cost: 220000 },
  { month: 'Aug', portCalls: 7, cost: 185000 },
  { month: 'Sep', portCalls: 9, cost: 245000 },
  { month: 'Oct', portCalls: 11, cost: 290000 },
  { month: 'Nov', portCalls: 6, cost: 160000 },
  { month: 'Dec', portCalls: 6, cost: 150000 },
];

const vesselPerformance = [
  { vessel: 'MV Pacific Star', portCalls: 12, avgTurnaround: 2.1, onTime: 100 },
  { vessel: 'MV Atlantic Voyager', portCalls: 10, avgTurnaround: 2.5, onTime: 90 },
  { vessel: 'MV Northern Wind', portCalls: 9, avgTurnaround: 2.3, onTime: 89 },
  { vessel: 'MV Indian Ocean', portCalls: 8, avgTurnaround: 2.8, onTime: 88 },
  { vessel: 'MV Arctic Explorer', portCalls: 8, avgTurnaround: 2.2, onTime: 100 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6m');
  const [isExporting, setIsExporting] = useState(false);

  const getDateRangeLabel = (range: string): string => {
    switch (range) {
      case '1m': return 'Last Month';
      case '3m': return 'Last 3 Months';
      case '6m': return 'Last 6 Months';
      case '1y': return 'Last Year';
      default: return 'Last 6 Months';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReportPDF({
        title: 'Fleet Performance Report',
        dateRange: getDateRangeLabel(dateRange),
        generatedAt: new Date(),
        metrics: fleetMetrics,
        portCallsByPort,
        serviceBreakdown,
        vesselPerformance,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PortalShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-slate-500 mt-1">
              Fleet performance and operational insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Anchor className="w-5 h-5 text-blue-600" />
              </div>
              <div className={clsx(
                'flex items-center gap-1 text-sm',
                fleetMetrics.portCallsChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {fleetMetrics.portCallsChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(fleetMetrics.portCallsChange)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {fleetMetrics.totalPortCalls}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Port Calls</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div className={clsx(
                'flex items-center gap-1 text-sm',
                fleetMetrics.turnaroundChange <= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {fleetMetrics.turnaroundChange <= 0 ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                {Math.abs(fleetMetrics.turnaroundChange)}d
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {fleetMetrics.avgTurnaroundTime}d
            </p>
            <p className="text-sm text-slate-500 mt-1">Avg Turnaround</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className={clsx(
                'flex items-center gap-1 text-sm',
                fleetMetrics.costChange <= 5 ? 'text-green-600' : 'text-amber-600'
              )}>
                <ArrowUpRight className="w-4 h-4" />
                {fleetMetrics.costChange}%
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ${(fleetMetrics.totalServiceCost / 1000000).toFixed(2)}M
            </p>
            <p className="text-sm text-slate-500 mt-1">Service Costs</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                {fleetMetrics.onTimeChange}%
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {fleetMetrics.onTimeArrival}%
            </p>
            <p className="text-sm text-slate-500 mt-1">On-Time Arrival</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Port Calls by Port */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Port Calls by Location
              </h3>
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {portCallsByPort.map((item) => (
                <div key={item.port}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.port}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.count} calls
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Cost Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Service Cost Breakdown
              </h3>
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {serviceBreakdown.map((item, index) => {
                const colors = [
                  'bg-blue-500',
                  'bg-emerald-500',
                  'bg-purple-500',
                  'bg-amber-500',
                  'bg-cyan-500',
                  'bg-slate-400',
                ];
                return (
                  <div key={item.service}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {item.service}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full', colors[index])}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Monthly Trend
            </h3>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-end justify-between gap-4 min-w-[500px] h-48">
              {monthlyTrend.map((item) => {
                const maxCalls = Math.max(...monthlyTrend.map((m) => m.portCalls));
                const height = (item.portCalls / maxCalls) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {formatCurrency(item.cost)}
                    </div>
                    <div className="w-full relative">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height * 1.5}px` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                      {item.portCalls}
                    </div>
                    <div className="text-xs text-slate-500">{item.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Port Calls</span>
            </div>
          </div>
        </div>

        {/* Vessel Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Vessel Performance
              </h3>
              <Ship className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vessel
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Port Calls
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Avg Turnaround
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    On-Time %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {vesselPerformance.map((vessel) => (
                  <tr key={vessel.vessel} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <Ship className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {vessel.vessel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                      {vessel.portCalls}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                      {vessel.avgTurnaround} days
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          vessel.onTime >= 95
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : vessel.onTime >= 85
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        )}
                      >
                        {vessel.onTime}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
