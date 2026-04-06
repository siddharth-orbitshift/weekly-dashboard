const BASE_URL = 'https://amplitude.com/api/2';

function authHeader(): string {
  const key = process.env.AMPLITUDE_API_KEY;
  const secret = process.env.AMPLITUDE_SECRET_KEY;
  if (!key || !secret) throw new Error('Amplitude credentials not configured');
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function getActiveUsers(
  metric: 'wau' | 'mau',
  tenantIds?: number[]
): Promise<{ xValues: string[]; values: number[] }> {
  const interval = metric === 'wau' ? 7 : 30;
  const end = new Date();
  const start = new Date();
  if (metric === 'wau') {
    start.setDate(start.getDate() - 7 * 12); // 12 weeks back
  } else {
    start.setMonth(start.getMonth() - 12); // 12 months back
  }

  const params: Record<string, string> = {
    e: JSON.stringify({ event_type: 'Any Event' }),
    m: 'uniques',
    start: formatDate(start),
    end: formatDate(end),
    i: String(interval),
  };

  if (tenantIds && tenantIds.length > 0) {
    params.s = JSON.stringify([
      {
        prop: 'tenant_id',
        op: 'is',
        values: tenantIds.map(String),
        type: 'user',
      },
    ]);
  }

  const qs = new URLSearchParams(params);
  const res = await fetch(`${BASE_URL}/events/segmentation?${qs}`, {
    headers: { Authorization: authHeader() },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amplitude API ${res.status}: ${text}`);
  }

  const json = await res.json();
  const series: number[] = json?.data?.series?.[0] ?? [];
  const xValues: string[] = json?.data?.xValues ?? [];
  return { xValues, values: series };
}
