import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface AmplitudeCache {
  cachedAt: string;
  wau: { xValues: string[]; values: number[] };
  mau: { xValues: string[]; values: number[] };
}

function readCache(): AmplitudeCache {
  const cachePath = join(process.cwd(), 'data', 'amplitude-cache.json');
  const raw = readFileSync(cachePath, 'utf-8');
  return JSON.parse(raw);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const metric = (searchParams.get('metric') ?? 'wau') as 'wau' | 'mau';

  try {
    const cache = readCache();
    const data = metric === 'wau' ? cache.wau : cache.mau;
    return NextResponse.json({ ...data, cachedAt: cache.cachedAt });
  } catch (err) {
    console.error('Amplitude cache read error:', err);
    return NextResponse.json(
      { error: 'Amplitude data unavailable — refresh the cache via the scheduled agent.' },
      { status: 500 }
    );
  }
}
