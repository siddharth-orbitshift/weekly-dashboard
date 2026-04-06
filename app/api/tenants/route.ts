import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export interface Tenant {
  id: number;
  name: string;
  is_client: boolean;
  is_pilot: boolean;
}

export async function GET() {
  try {
    const result = await pool.query<{
      id: string;
      name: string;
      is_client: boolean;
    }>(`
      SELECT id, name, is_client
      FROM tenants
      WHERE is_live_tenant = true
        AND name != 'OrbitShift demo'
      ORDER BY name ASC
    `);

    const tenants: Tenant[] = result.rows.map((r) => ({
      id: parseInt(r.id),
      name: r.name,
      is_client: r.is_client,
      is_pilot: !r.is_client,
    }));

    return NextResponse.json({ tenants });
  } catch (err) {
    console.error('Tenants API error:', err);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}
