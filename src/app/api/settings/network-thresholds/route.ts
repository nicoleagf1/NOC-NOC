import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface ProviderThreshold {
  name: string;
  interface: string;
  minMbps: number;
  maxCapacityMbps: number;
  saturationThresholdPercent: number;
}

export interface NetworkThresholdsConfig {
  enabled: boolean;
  providers: {
    netuno: ProviderThreshold;
    digitel: ProviderThreshold;
  };
  updatedAt?: string;
}

export const DEFAULT_NETWORK_THRESHOLDS: NetworkThresholdsConfig = {
  enabled: true,
  providers: {
    netuno: {
      name: 'Netuno (wan1)',
      interface: 'wan1',
      minMbps: 15.0,
      maxCapacityMbps: 100.0,
      saturationThresholdPercent: 90
    },
    digitel: {
      name: 'Digitel (wan2)',
      interface: 'wan2',
      minMbps: 10.0,
      maxCapacityMbps: 50.0,
      saturationThresholdPercent: 90
    }
  }
};

async function ensureSettingsTable() {
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
    VALUES ($1, $2, $3)
    ON CONFLICT (key) DO NOTHING;
  `, [
    'network_alert_thresholds',
    JSON.stringify(DEFAULT_NETWORK_THRESHOLDS),
    'Umbrales de velocidad y saturación para alertas de conexión inestable en enlaces WAN'
  ]);
}

export async function GET() {
  try {
    await ensureSettingsTable();
    const res = await query(
      `SELECT value FROM system_settings WHERE key = 'network_alert_thresholds'`
    );

    if (res.rows.length === 0 || !res.rows[0].value) {
      return NextResponse.json({ success: true, config: DEFAULT_NETWORK_THRESHOLDS });
    }

    const value = typeof res.rows[0].value === 'string'
      ? JSON.parse(res.rows[0].value)
      : res.rows[0].value;

    return NextResponse.json({ success: true, config: value });
  } catch (error: any) {
    console.error('Error fetching network thresholds:', error);
    return NextResponse.json(
      { success: false, config: DEFAULT_NETWORK_THRESHOLDS, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const config: NetworkThresholdsConfig = {
      enabled: body.enabled ?? true,
      providers: {
        netuno: {
          name: 'Netuno (wan1)',
          interface: 'wan1',
          minMbps: Number(body.providers?.netuno?.minMbps) || 15.0,
          maxCapacityMbps: Number(body.providers?.netuno?.maxCapacityMbps) || 100.0,
          saturationThresholdPercent: Number(body.providers?.netuno?.saturationThresholdPercent) || 90
        },
        digitel: {
          name: 'Digitel (wan2)',
          interface: 'wan2',
          minMbps: Number(body.providers?.digitel?.minMbps) || 10.0,
          maxCapacityMbps: Number(body.providers?.digitel?.maxCapacityMbps) || 50.0,
          saturationThresholdPercent: Number(body.providers?.digitel?.saturationThresholdPercent) || 90
        }
      },
      updatedAt: new Date().toISOString()
    };

    await ensureSettingsTable();

    await query(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
    `, [
      'network_alert_thresholds',
      JSON.stringify(config),
      'Umbrales de velocidad y saturación para alertas de conexión inestable en enlaces WAN'
    ]);

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Error updating network thresholds:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la configuración de umbrales de red' },
      { status: 500 }
    );
  }
}
