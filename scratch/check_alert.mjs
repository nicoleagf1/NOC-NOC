import pg from 'pg';
import fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf-8');
envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[match[1]] = value;
    }
});

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function main() {
  try {
    const alerts = await pool.query("SELECT * FROM alert_incident_history WHERE incident_id = '40bafed3-21a3-48cd-be87-b4120862edf5'");
    console.log("ALERT:", JSON.stringify(alerts.rows, null, 2));

    const allActive = await pool.query("SELECT incident_id, service_id, service_name, metric_trigger, current_status, triggered_at, resolved_at, technical_detail FROM alert_incident_history WHERE current_status = 'ACTIVA'");
    console.log("ALL ACTIVE:", JSON.stringify(allActive.rows, null, 2));

    const connections = await pool.query("SELECT id, name, type, url, is_active FROM integration_connections");
    console.log("CONNECTIONS:", JSON.stringify(connections.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
