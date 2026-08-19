import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decrypt, isMasked } from '@/lib/security';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        h.id, 
        h.hostname, 
        h.ip_address, 
        h.environment, 
        h.os_type, 
        h.server_role,
        h.is_monitored,
        h.vault_username,
        h.vault_password,
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'slug', s.slug,
            'current_status', s.current_status
          )
        ) FILTER (WHERE s.id IS NOT NULL) AS services
      FROM infrastructure_hosts h
      LEFT JOIN host_services hs ON h.id = hs.host_id
      LEFT JOIN business_services s ON hs.service_id = s.id
      GROUP BY h.id
      ORDER BY h.created_at DESC;
    `);

    // Transformar los nulls de services en arrays vacíos y desencriptar
    const data = res.rows.map((row: any) => {
      let decryptedPassword = null;
      if (row.vault_password) {
        try {
          decryptedPassword = decrypt(row.vault_password);
        } catch (e) {
          decryptedPassword = 'ERROR_DECRYPTING';
        }
      }

      return {
        ...row,
        vault_password: decryptedPassword,
        services: row.services || []
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching vault hosts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
