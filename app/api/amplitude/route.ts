import { NextRequest, NextResponse } from 'next/server';
import { getActiveUsers } from '@/lib/amplitude';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const metric = (searchParams.get('metric') ?? 'wau') as 'wau' | 'mau';
  const tenantIdsParam = searchParams.get('tenantIds');

  const tenantIds = tenantIdsParam
    ? tenantIdsParam.split(',').map(Number).filter(Boolean)
    : undefined;

  try {
    const data = await getActiveUsers(metric, tenantIds);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Amplitude API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Amplitude error' },
      { status: 500 }
    );
  }
}
