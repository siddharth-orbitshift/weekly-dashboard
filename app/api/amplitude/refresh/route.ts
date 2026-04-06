import { NextResponse } from 'next/server';
import { getActiveUsers } from '@/lib/amplitude';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
  try {
    const [wau, mau] = await Promise.all([
      getActiveUsers('wau'),
      getActiveUsers('mau'),
    ]);

    // Format MAU xValues as YYYY-MM
    const mauFormatted = {
      ...mau,
      xValues: mau.xValues.map((x) => x.slice(0, 7)),
    };

    const cache = {
      cachedAt: new Date().toISOString(),
      wau,
      mau: mauFormatted,
    };

    const cachePath = join(process.cwd(), 'data', 'amplitude-cache.json');
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));

    return NextResponse.json({ success: true, cachedAt: cache.cachedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
