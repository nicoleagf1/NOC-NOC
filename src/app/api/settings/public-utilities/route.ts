import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await query(`
    INSERT INTO system_settings (key, value, description)
    VALUES ('public_utilities_enabled', 'true', 'Habilitar acceso público al modo rápido de utilidades')
    ON CONFLICT (key) DO NOTHING;
  `);
}

export async function GET() {
  try {
    await ensureTable();
    const res = await query(`SELECT value FROM system_settings WHERE key = 'public_utilities_enabled'`);
    const enabled = res.rows.length > 0 ? (res.rows[0].value === true || res.rows[0].value === 'true') : true;
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ enabled: true });
  }
}

export async function PUT(req: Request) {
  try {
    const { enabled } = await req.json();
    await ensureTable();
    await query(`
      UPDATE system_settings 
      SET value = $1, updated_at = NOW() 
      WHERE key = 'public_utilities_enabled'
    `, [enabled ? 'true' : 'false']);
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
