import { query } from './src/lib/db.js';

async function test() {
  try {
    const res = await query(`
      SELECT * FROM (
        SELECT 
          h.id, 
          'HOST' as asset_type,
          h.hostname as name, 
          h.ip_address as ip_or_url, 
          h.environment, 
          h.os_type, 
          h.server_role,
          h.is_monitored,
          h.vault_username,
          h.vault_password,
          h.description,
          h.created_at,
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'slug', s.slug,
              'current_status', s.current_status
            )
          ) FILTER (WHERE s.id IS NOT NULL) AS related_entities
        FROM infrastructure_hosts h
        LEFT JOIN host_services hs ON h.id = hs.host_id
        LEFT JOIN business_services s ON hs.service_id = s.id
        GROUP BY h.id

        UNION ALL

        SELECT 
          bs.id, 
          'SERVICE' as asset_type,
          bs.name as name, 
          bs.endpoint_url as ip_or_url, 
          'PROD' as environment, 
          'Web' as os_type, 
          bs.monitor_type as server_role,
          (bs.uptime_kuma_monitor_id IS NOT NULL) as is_monitored,
          bs.vault_username,
          bs.vault_password,
          bs.description,
          bs.created_at,
          json_agg(
            json_build_object(
              'id', h.id,
              'name', h.hostname,
              'slug', h.ip_address,
              'current_status', 'N/A'
            )
          ) FILTER (WHERE h.id IS NOT NULL) AS related_entities
        FROM business_services bs
        LEFT JOIN host_services hs ON bs.id = hs.service_id
        LEFT JOIN infrastructure_hosts h ON hs.host_id = h.id
        GROUP BY bs.id
      ) AS unified_vault
      ORDER BY created_at DESC;
    `);
    console.log("Success:", res.rows.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
