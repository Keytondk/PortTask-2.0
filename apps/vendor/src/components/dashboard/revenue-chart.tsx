'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', revenue: 28000 },
  { month: 'Feb', revenue: 35000 },
  { month: 'Mar', revenue: 32000 },
  { month: 'Apr', revenue: 41000 },
  { month: 'May', revenue: 38000 },
  { month: 'Jun', revenue: 45000 },
];

export function RevenueChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Revenue Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monthly revenue for the past 6 months
          </p>
        </div>
        <select className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500">
          <option>Last 6 months</option>
          <option>Last year</option>
          <option>All time</option>
        </select>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                'Revenue',
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div>
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            $219,000
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Avg per Month</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            $36,500
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Growth</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            +18%
          </p>
        </div>
      </div>
    </div>
  );
}
