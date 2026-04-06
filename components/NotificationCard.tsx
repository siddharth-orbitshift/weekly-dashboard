'use client';

interface Props {
  count7d: number;
  count30d: number;
  pct7d: number;
  pct30d: number;
  loading: boolean;
  error?: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-800">{value}</span>
    </div>
  );
}

export default function NotificationCard({
  count7d,
  count30d,
  pct7d,
  pct30d,
  loading,
  error,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Notifications (SendGrid Delivered)
      </h2>
      {loading ? (
        <div className="h-16 flex items-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="h-16 flex items-center text-red-400 text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Sent — last 7d" value={count7d.toLocaleString()} />
          <Stat label="Sent — last 30d" value={count30d.toLocaleString()} />
          <Stat label="% notified — last 7d" value={`${pct7d}%`} />
          <Stat label="% notified — last 30d" value={`${pct30d}%`} />
        </div>
      )}
      <p className="text-xs text-gray-400">
        % = unique users notified ÷ eligible users (active, with accounts)
      </p>
    </div>
  );
}
