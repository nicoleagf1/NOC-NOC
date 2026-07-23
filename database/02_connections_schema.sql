BEGIN;

-- ==============================================================================
-- NOC-NOC DATABASE SCHEMA: MONITORING CONNECTIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS monitoring_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('prometheus', 'uptime-kuma')),
    url VARCHAR(255) NOT NULL,
    auth_type VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'basic', 'bearer')),
    auth_credentials TEXT, -- Almacenará el JSON cifrado con token o user/pass
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas al resolver conexiones activas por tipo
CREATE INDEX IF NOT EXISTS idx_monitoring_connections_active ON monitoring_connections(type) WHERE is_active = TRUE;

-- ==========================================
-- AUTOMATIZACIÓN (TRIGGERS)
-- ==========================================

-- Utilizamos la misma función de update_timestamp que creamos en init.sql
DROP TRIGGER IF EXISTS trg_update_connection_timestamp ON monitoring_connections;
CREATE TRIGGER trg_update_connection_timestamp
BEFORE UPDATE ON monitoring_connections
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- ==========================================
-- DATOS SEMILLA (SEEDERS)
-- ==========================================

-- Insertamos la conexión por defecto para que el dashboard no se rompa (Prometheus activo)
-- Usamos un id fijo predecible para evitar duplicados en ejecuciones repetidas
INSERT INTO monitoring_connections (id, name, type, url, auth_type, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Prometheus Principal',
    'prometheus',
    'https://prometheus.vepagos.com',
    'none',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
