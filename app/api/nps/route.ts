import { NextRequest, NextResponse } from 'next/server';
import { getNpsEntries } from '@/lib/slack';
import pool from '@/lib/db';

export interface NpsData {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

function calcNps(scores: number[]): NpsData {
  const total = scores.length;
  if (total === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const passives = total - promoters - detractors;
  const score = Math.round(((promoters - detractors) / total) * 100);
  return { score, promoters, passives, detractors, total };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantIdsParam = searchParams.get('tenantIds');
  const tenantIds = tenantIdsParam
    ? tenantIdsParam.split(',').map(Number).filter(Boolean)
    : null;

  const channelId = process.env.SLACK_NPS_CHANNEL_ID ?? 'C08JZCY37TJ';

  try {
    // Fetch messages from the past 90 days (covers both windows)
    const oldest90d = Date.now() / 1000 - 90 * 86400;
    const entries = await getNpsEntries(channelId, oldest90d);

    // Get all emails and cross-reference with users table for tenant filtering
    const allEmails = [...new Set(entries.map((e) => e.email))];

    let allowedEmails: Set<string> | null = null;

    if (tenantIds && tenantIds.length > 0 && allEmails.length > 0) {
      const result = await pool.query<{ email: string }>(
        `SELECT email FROM users
         WHERE LOWER(email) = ANY($1::text[])
           AND tenant_id = ANY($2::int[])`,
        [allEmails, tenantIds]
      );
      allowedEmails = new Set(result.rows.map((r) => r.email.toLowerCase()));
    }

    const now = Date.now() / 1000;
    const cutoff30d = now - 30 * 86400;
    const cutoff90d = now - 90 * 86400;

    const filtered = (cutoff: number) =>
      entries
        .filter((e) => e.ts >= cutoff)
        .filter((e) => !allowedEmails || allowedEmails.has(e.email))
        .map((e) => e.score);

    return NextResponse.json({
      nps30d: calcNps(filtered(cutoff30d)),
      nps90d: calcNps(filtered(cutoff90d)),
    });
  } catch (err) {
    console.error('NPS API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'NPS error' },
      { status: 500 }
    );
  }
}
