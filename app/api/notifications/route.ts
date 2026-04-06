import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export interface NotificationData {
  count7d: number;
  count30d: number;
  pct7d: number;
  pct30d: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenantIdsParam = searchParams.get('tenantIds');
  const tenantIds = tenantIdsParam
    ? tenantIdsParam.split(',').map(Number).filter(Boolean)
    : null;

  try {
    // Build tenant filter clause
    const tenantClause =
      tenantIds && tenantIds.length > 0
        ? `AND u.tenant_id = ANY($1::int[])`
        : '';
    const queryParams = tenantIds && tenantIds.length > 0 ? [tenantIds] : [];

    // Denominator: eligible users (is_deactivated=false AND has accounts)
    const denomResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM users u
       WHERE u.is_deactivated = false
         AND array_length(u.master_accounts, 1) > 0
         ${tenantClause}`,
      queryParams
    );
    const denominator = parseInt(denomResult.rows[0].count);

    // Notification counts and unique notified users — last 7 days
    const notif7d = await pool.query<{ total: string; unique_users: string }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(DISTINCT uad.user_id) AS unique_users
       FROM user_activity_data uad
       JOIN users u ON u.email = uad.user_id
       WHERE uad.event_type = '[Sendgrid] delivered'
         AND uad.event_timestamp >= NOW() - INTERVAL '7 days'
         AND u.is_deactivated = false
         AND array_length(u.master_accounts, 1) > 0
         ${tenantClause}`,
      queryParams
    );

    // Last 30 days
    const notif30d = await pool.query<{ total: string; unique_users: string }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(DISTINCT uad.user_id) AS unique_users
       FROM user_activity_data uad
       JOIN users u ON u.email = uad.user_id
       WHERE uad.event_type = '[Sendgrid] delivered'
         AND uad.event_timestamp >= NOW() - INTERVAL '30 days'
         AND u.is_deactivated = false
         AND array_length(u.master_accounts, 1) > 0
         ${tenantClause}`,
      queryParams
    );

    const count7d = parseInt(notif7d.rows[0].total);
    const count30d = parseInt(notif30d.rows[0].total);
    const unique7d = parseInt(notif7d.rows[0].unique_users);
    const unique30d = parseInt(notif30d.rows[0].unique_users);

    const pct7d = denominator > 0 ? Math.round((unique7d / denominator) * 100) : 0;
    const pct30d = denominator > 0 ? Math.round((unique30d / denominator) * 100) : 0;

    const data: NotificationData = { count7d, count30d, pct7d, pct30d };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Notifications API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error' },
      { status: 500 }
    );
  }
}
