'use client';

import { useEffect, useState, useCallback } from 'react';
import ActivityChart from '@/components/ActivityChart';
import NotificationCard from '@/components/NotificationCard';
import NPSCard from '@/components/NPSCard';

interface Tenant {
  id: number;
  name: string;
  is_client: boolean;
  is_pilot: boolean;
}

interface ChartData {
  xValues: string[];
  values: number[];
}

interface NotificationData {
  count7d: number;
  count30d: number;
  pct7d: number;
  pct30d: number;
}

interface NpsResult {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

interface NpsData {
  nps30d: NpsResult;
  nps90d: NpsResult;
}

type PilotFilter = 'all' | 'pilot' | 'non-pilot';

function toChartData(raw: ChartData | null): { label: string; value: number }[] {
  if (!raw) return [];
  return raw.xValues.map((x, i) => ({ label: x, value: raw.values[i] ?? 0 }));
}

function buildTenantIds(
  tenants: Tenant[],
  selectedTenantId: number | null,
  pilotFilter: PilotFilter
): number[] | null {
  if (selectedTenantId !== null) return [selectedTenantId];
  if (pilotFilter === 'all') return null;
  const filtered = tenants.filter((t) =>
    pilotFilter === 'pilot' ? t.is_pilot : !t.is_pilot
  );
  return filtered.map((t) => t.id);
}

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [pilotFilter, setPilotFilter] = useState<PilotFilter>('all');

  const [wau, setWau] = useState<ChartData | null>(null);
  const [mau, setMau] = useState<ChartData | null>(null);
  const [amplitudeCachedAt, setAmplitudeCachedAt] = useState<string | undefined>();
  const [wauLoading, setWauLoading] = useState(false);
  const [mauLoading, setMauLoading] = useState(false);
  const [wauError, setWauError] = useState<string | undefined>();
  const [mauError, setMauError] = useState<string | undefined>();

  const [notifs, setNotifs] = useState<NotificationData | null>(null);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsError, setNotifsError] = useState<string | undefined>();

  const [nps, setNps] = useState<NpsData | null>(null);
  const [npsLoading, setNpsLoading] = useState(false);
  const [npsError, setNpsError] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/tenants')
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants ?? []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    const ids = buildTenantIds(tenants, selectedTenantId, pilotFilter);
    const idsParam = ids ? `tenantIds=${ids.join(',')}` : '';

    setWauLoading(true);
    setWauError(undefined);
    fetch(`/api/amplitude?metric=wau${idsParam ? '&' + idsParam : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setWau(d);
        if (d.cachedAt) setAmplitudeCachedAt(d.cachedAt);
      })
      .catch((e) => setWauError(e.message))
      .finally(() => setWauLoading(false));

    setMauLoading(true);
    setMauError(undefined);
    fetch(`/api/amplitude?metric=mau${idsParam ? '&' + idsParam : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setMau(d);
      })
      .catch((e) => setMauError(e.message))
      .finally(() => setMauLoading(false));

    setNotifsLoading(true);
    setNotifsError(undefined);
    fetch(`/api/notifications${idsParam ? '?' + idsParam : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setNotifs(d);
      })
      .catch((e) => setNotifsError(e.message))
      .finally(() => setNotifsLoading(false));

    setNpsLoading(true);
    setNpsError(undefined);
    fetch(`/api/nps${idsParam ? '?' + idsParam : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setNps(d);
      })
      .catch((e) => setNpsError(e.message))
      .finally(() => setNpsLoading(false));
  }, [tenants, selectedTenantId, pilotFilter]);

  useEffect(() => {
    if (tenants.length === 0) return;
    fetchData();
  }, [fetchData, tenants]);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
  const displayName = selectedTenant ? selectedTenant.name : 'All tenants';

  const filteredTenants =
    pilotFilter === 'all'
      ? tenants
      : tenants.filter((t) =>
          pilotFilter === 'pilot' ? t.is_pilot : !t.is_pilot
        );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Weekly Dashboard</h1>
          <button
            onClick={fetchData}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 hover:border-indigo-400 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedTenantId ?? ''}
            onChange={(e) =>
              setSelectedTenantId(e.target.value === '' ? null : parseInt(e.target.value))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-48"
          >
            <option value="">All tenants</option>
            {filteredTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.is_pilot ? ' (Pilot)' : ''}
              </option>
            ))}
          </select>

          <select
            value={pilotFilter}
            onChange={(e) => {
              setPilotFilter(e.target.value as PilotFilter);
              setSelectedTenantId(null);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All</option>
            <option value="pilot">Pilot</option>
            <option value="non-pilot">Non-pilot</option>
          </select>

          <span className="text-xs text-gray-400">
            Showing:{' '}
            <span className="font-medium text-gray-600">{displayName}</span>
            {pilotFilter !== 'all' && selectedTenantId === null && (
              <span className="ml-1">({pilotFilter})</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityChart
            title="Weekly Active Users"
            data={toChartData(wau)}
            loading={wauLoading}
            error={wauError}
            cachedAt={amplitudeCachedAt}
          />
          <ActivityChart
            title="Monthly Active Users"
            data={toChartData(mau)}
            loading={mauLoading}
            error={mauError}
            cachedAt={amplitudeCachedAt}
          />
        </div>

        <NotificationCard
          count7d={notifs?.count7d ?? 0}
          count30d={notifs?.count30d ?? 0}
          pct7d={notifs?.pct7d ?? 0}
          pct30d={notifs?.pct30d ?? 0}
          loading={notifsLoading}
          error={notifsError}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NPSCard
            label="Last 30 days"
            data={nps?.nps30d}
            loading={npsLoading}
            error={npsError}
          />
          <NPSCard
            label="Last 90 days"
            data={nps?.nps90d}
            loading={npsLoading}
            error={npsError}
          />
        </div>
      </div>
    </main>
  );
}
