'use client';

import {
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@navo/ui';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ship,
  Anchor,
  Fuel,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useState } from 'react';

const stats = [
  {
    name: 'Total Spend',
    value: '$2.4M',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    name: 'Port Calls',
    value: '156',
    change: '+8.3%',
    trend: 'up',
    icon: Anchor,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    name: 'Avg Cost/Call',
    value: '$15.4K',
    change: '-3.2%',
    trend: 'down',
    icon: BarChart3,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    name: 'Avg Lead Time',
    value: '4.2 days',
    change: '-15%',
    trend: 'down',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

const spendByService = [
  { name: 'Bunker Supply', value: 1650000, percentage: 68, color: 'bg-blue-500' },
  { name: 'Repairs', value: 380000, percentage: 16, color: 'bg-purple-500' },
  { name: 'Provisions', value: 195000, percentage: 8, color: 'bg-amber-500' },
  { name: 'Fresh Water', value: 120000, percentage: 5, color: 'bg-emerald-500' },
  { name: 'Other', value: 55000, percentage: 3, color: 'bg-gray-400' },
];

const spendByPort = [
  { name: 'Singapore', spend: 890000, calls: 45 },
  { name: 'Rotterdam', spend: 520000, calls: 32 },
  { name: 'Dubai', spend: 380000, calls: 28 },
  { name: 'Shanghai', spend: 320000, calls: 25 },
  { name: 'Houston', spend: 290000, calls: 26 },
];

const monthlySpend = [
  { month: 'Jan', spend: 180000, calls: 12 },
  { month: 'Feb', spend: 165000, calls: 11 },
  { month: 'Mar', spend: 220000, calls: 15 },
  { month: 'Apr', spend: 195000, calls: 13 },
  { month: 'May', spend: 245000, calls: 16 },
  { month: 'Jun', spend: 210000, calls: 14 },
  { month: 'Jul', spend: 235000, calls: 15 },
  { month: 'Aug', spend: 280000, calls: 18 },
  { month: 'Sep', spend: 255000, calls: 17 },
  { month: 'Oct', spend: 190000, calls: 13 },
  { month: 'Nov', spend: 175000, calls: 12 },
  { month: 'Dec', spend: 50000, calls: 4 },
];

const topVendors = [
  { name: 'Marine Fuel Solutions', spend: 650000, orders: 28, rating: 4.8 },
  { name: 'Port Services International', spend: 420000, orders: 45, rating: 4.6 },
  { name: 'Gulf Marine Services', spend: 380000, orders: 15, rating: 4.4 },
  { name: 'Singapore Bunker Co.', spend: 340000, orders: 22, rating: 4.5 },
  { name: 'Asia Pacific Fuels', spend: 210000, orders: 12, rating: 4.2 },
];

function formatPrice(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('year');

  const maxMonthlySpend = Math.max(...monthlySpend.map((m) => m.spend));
  const maxPortSpend = Math.max(...spendByPort.map((p) => p.spend));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Insights into your maritime operations</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last quarter</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className="font-medium text-emerald-600">{stat.change}</span>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Spend Chart */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Monthly Spend</h3>
          <div className="space-y-3">
            {monthlySpend.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <span className="w-8 text-sm text-muted-foreground">{month.month}</span>
                <div className="flex-1">
                  <div className="h-6 w-full rounded-full bg-muted">
                    <div
                      className="h-6 rounded-full bg-primary transition-all"
                      style={{ width: `${(month.spend / maxMonthlySpend) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm font-medium">
                  {formatPrice(month.spend)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Spend by Service */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Spend by Service</h3>
          <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full">
            {spendByService.map((service) => (
              <div
                key={service.name}
                className={`${service.color} transition-all`}
                style={{ width: `${service.percentage}%` }}
              />
            ))}
          </div>
          <div className="space-y-3">
            {spendByService.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${service.color}`} />
                  <span className="text-sm">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{service.percentage}%</span>
                  <span className="w-20 text-right text-sm font-medium">
                    {formatPrice(service.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Spend by Port */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Spend by Port</h3>
          <div className="space-y-4">
            {spendByPort.map((port, index) => (
              <div key={port.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{port.name}</span>
                  </div>
                  <span className="font-semibold">{formatPrice(port.spend)}</span>
                </div>
                <div className="ml-8 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${(port.spend / maxPortSpend) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-muted-foreground">
                    {port.calls} calls
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Vendors */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Top Vendors</h3>
          <div className="space-y-4">
            {topVendors.map((vendor, index) => (
              <div
                key={vendor.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.orders} orders · {vendor.rating} rating
                    </p>
                  </div>
                </div>
                <span className="font-semibold">{formatPrice(vendor.spend)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Key Performance Indicators</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Avg. RFQ Response Time</p>
            <p className="mt-1 text-2xl font-bold">18 hrs</p>
            <p className="mt-1 text-xs text-emerald-600">-22% vs last period</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Vendor Satisfaction</p>
            <p className="mt-1 text-2xl font-bold">4.6/5</p>
            <p className="mt-1 text-xs text-emerald-600">+0.2 vs last period</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">On-Time Delivery Rate</p>
            <p className="mt-1 text-2xl font-bold">94.2%</p>
            <p className="mt-1 text-xs text-emerald-600">+2.1% vs last period</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Cost Savings</p>
            <p className="mt-1 text-2xl font-bold">$128K</p>
            <p className="mt-1 text-xs text-muted-foreground">via competitive RFQs</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
