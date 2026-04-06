'use client';

interface NpsData {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

interface Props {
  label: string;
  data?: NpsData;
  loading: boolean;
  error?: string;
}

function scoreColor(score: number): string {
  if (score >= 50) return 'text-green-600';
  if (score >= 0) return 'text-yellow-600';
  return 'text-red-500';
}

export default function NPSCard({ label, data, loading, error }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">NPS — {label}</h2>
      {loading ? (
        <div className="h-24 flex items-center text-gray-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="h-24 flex items-center text-red-400 text-sm">{error}</div>
      ) : !data || data.total === 0 ? (
        <div className="h-24 flex items-center text-gray-400 text-sm">No responses</div>
      ) : (
        <>
          <div className={`text-5xl font-bold ${scoreColor(data.score)}`}>
            {data.score > 0 ? '+' : ''}
            {data.score}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>
              <span className="font-medium text-green-600">{data.promoters}</span> promoters
            </span>
            <span>
              <span className="font-medium text-gray-400">{data.passives}</span> passives
            </span>
            <span>
              <span className="font-medium text-red-500">{data.detractors}</span> detractors
            </span>
          </div>
          <div className="text-xs text-gray-400">{data.total} responses</div>
        </>
      )}
    </div>
  );
}
