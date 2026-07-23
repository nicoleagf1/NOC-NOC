import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import fs from 'fs';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno locales manualmente para no requerir dotenv
const envPath = join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sqlScript = `
-- =====================================================================
-- CONFIGURACIÓN DE BASE DE DATOS OPERACIONAL: NOC-NOC VEPAGOS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('ACTIVA', 'EN_PROGRESO', 'RESUELTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLAS
CREATE TABLE IF NOT EXISTS threshold_configs (
    threshold_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    warning_limit NUMERIC(5, 2) NOT NULL,
    critical_limit NUMERIC(5, 2) NOT NULL,
    window_duration VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_incident_history (
    incident_id UUID DEFAULT uuid_generate_v4(),
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    metric_trigger VARCHAR(100),
    severity alert_severity NOT NULL,
    current_status incident_status NOT NULL DEFAULT 'ACTIVA',
    technical_detail TEXT,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    
    duration_interval INTERVAL GENERATED ALWAYS AS (resolved_at - triggered_at) STORED,
    PRIMARY KEY (incident_id, triggered_at)
);

CREATE TABLE IF NOT EXISTS alert_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threshold_id UUID,
    operator_username VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    delta_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDICES
CREATE INDEX IF NOT EXISTS idx_incident_active 
ON alert_incident_history (current_status) 
WHERE current_status IN ('ACTIVA', 'EN_PROGRESO');

CREATE INDEX IF NOT EXISTS idx_incident_service_search 
ON alert_incident_history (service_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_jsonb_gin 
ON alert_audit_logs USING gin (delta_payload);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION fn_auto_resolve_incident()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resolved_at IS NOT NULL THEN
        NEW.current_status := 'RESUELTA';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_incident_resolution ON alert_incident_history;
CREATE TRIGGER trg_calculate_incident_resolution
BEFORE INSERT OR UPDATE ON alert_incident_history
FOR EACH ROW
EXECUTE FUNCTION fn_auto_resolve_incident();

-- =====================================================================
-- 5. INYECCIÓN DE DATOS (Umbrales Iniciales desde alert_rules.md)
-- =====================================================================
INSERT INTO threshold_configs (metric_name, warning_limit, critical_limit, window_duration)
VALUES 
  ('node_cpu_utilization', 80.00, 92.00, '5m'),
  ('node_memory_availability', 15.00, 5.00, '5m')
ON CONFLICT (metric_name) DO UPDATE 
SET warning_limit = EXCLUDED.warning_limit,
    critical_limit = EXCLUDED.critical_limit,
    window_duration = EXCLUDED.window_duration;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log("Iniciando migración de alertas y configuración de umbrales...");
    await client.query(sqlScript);
    console.log("✓ Esquema de base de datos de alertas creado/actualizado correctamente.");
    console.log("✓ Reglas base (CPU, RAM) inyectadas en threshold_configs.");
  } catch (err) {
    console.error("Error ejecutando migración:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
