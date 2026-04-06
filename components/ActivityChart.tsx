'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  title: string;
  data: { label: string; value: number }[];
  loading: boolean;
  error?: string;
  cachedAt?: string;
}

export default function ActivityChart({ title, data, loading, error, cachedAt }: Props) {
  const cacheLabel = cachedAt
    ? new Date(cachedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
        {cacheLabel && (
          <span className="text-xs text-gray-400">cached {cacheLabel}</span>
        )}
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Loading…
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-red-400 text-sm">{error}</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
