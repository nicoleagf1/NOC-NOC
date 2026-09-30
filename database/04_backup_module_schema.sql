BEGIN;

-- ==============================================================================
-- NOC-NOC DATABASE SCHEMA: BACKUP MODULE (Agentless Replication of SQLBackupAndFTP)
-- ==============================================================================

-- 1. TABLA: Trabajos de Respaldo (Backup Jobs)
CREATE TABLE IF NOT EXISTS backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    engine VARCHAR(50) NOT NULL CHECK (engine IN ('mssql', 'mysql', 'postgres')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Datos de conexión al motor de base de datos
    host VARCHAR(255) NOT NULL DEFAULT '127.0.0.1',
    port INTEGER NOT NULL DEFAULT 1433,
    database_name VARCHAR(100) NOT NULL,
    db_username VARCHAR(100) NOT NULL DEFAULT 'sa',
    db_password_encrypted TEXT,

    -- Configuración de Túnel SSH (para MySQL/Postgres remotos sin abrir puertos)
    use_ssh_tunnel BOOLEAN NOT NULL DEFAULT FALSE,
    ssh_host VARCHAR(255),
    ssh_port INTEGER DEFAULT 22,
    ssh_username VARCHAR(100),
    ssh_password_encrypted TEXT,

    -- Destino de almacenamiento
    destination_type VARCHAR(50) NOT NULL DEFAULT 'nas' CHECK (destination_type IN ('nas', 'local', 's3')),
    destination_path TEXT NOT NULL DEFAULT '\\192.168.0.27\SqlResBackupAllDB',

    -- Planificación y políticas de retención
    cron_schedule VARCHAR(50) NOT NULL DEFAULT '0 1 * * *', -- Diario a la 01:00 AM
    schedule_description VARCHAR(100) DEFAULT 'Diario a la 01:00 AM (cada 24h)',
    retention_days INTEGER NOT NULL DEFAULT 30,
    compression_format VARCHAR(20) NOT NULL DEFAULT 'zip' CHECK (compression_format IN ('zip', '7z', 'gzip', 'none')),

    -- Notificaciones y alertas
    send_alert_on_failure BOOLEAN NOT NULL DEFAULT TRUE,
    notification_email VARCHAR(150),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: Historial de Respaldos (Backup History)
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
    backup_type VARCHAR(20) NOT NULL DEFAULT 'FULL' CHECK (backup_type IN ('FULL', 'DIFF')),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_size_formatted VARCHAR(50),
    destination_saved_path TEXT,
    error_message TEXT,
    log_output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ÍNDICES DE RENDIMIENTO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_backup_jobs_active ON backup_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_backup_history_job_date ON backup_history(job_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);

-- ==========================================
-- TRIGGERS DE ACTUALIZACIÓN DE TIMESTAMP
-- ==========================================
DROP TRIGGER IF EXISTS trg_update_backup_jobs_timestamp ON backup_jobs;
CREATE TRIGGER trg_update_backup_jobs_timestamp
BEFORE UPDATE ON backup_jobs
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- ==========================================
-- DATOS SEMILLA INICIALES (Mapeo de tu SQLBackupAndFTP actual)
-- ==========================================

INSERT INTO backup_jobs (
    id,
    name,
    engine,
    is_active,
    host,
    port,
    database_name,
    db_username,
    use_ssh_tunnel,
    destination_type,
    destination_path,
    cron_schedule,
    schedule_description,
    retention_days
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '1.1 Profit',
    'mssql',
    TRUE,
    '127.0.0.1',
    1433,
    'CVEPAG',
    'sa',
    FALSE,
    'nas',
    '\\192.168.0.27\SqlResBackupAllDB\1. Profit',
    '0 1 * * *',
    'Diario a la 01:00 AM (cada 24h)',
    30
),
(
    '22222222-2222-2222-2222-222222222222',
    '1.2 Profit',
    'mssql',
    TRUE,
    '127.0.0.1',
    1433,
    'CVEPAG',
    'sa',
    FALSE,
    'nas',
    '\\192.168.0.27\SqlResBackupAllDB\1.2 Profit',
    '0 2 * * *',
    'Diario a las 02:00 AM (cada 24h)',
    30
),
(
    '33333333-3333-3333-3333-333333333333',
    'MySQL Remoto VEPagos',
    'mysql',
    TRUE,
    '127.0.0.1',
    3306,
    'cvepag_mysql',
    'administrador',
    TRUE,
    'nas',
    '\\192.168.0.27\SqlResBackupAllDB\MySQL',
    '0 3 * * *',
    'Diario a las 03:00 AM (cada 24h)',
    30
)
ON CONFLICT (name) DO NOTHING;

-- Registro de historial de ejemplo para que la maqueta muestre datos de inmediato
INSERT INTO backup_history (
    job_id,
    started_at,
    finished_at,
    duration_seconds,
    status,
    backup_type,
    file_name,
    file_size_bytes,
    file_size_formatted,
    destination_saved_path
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '142 seconds',
    142,
    'SUCCESS',
    'FULL',
    'CVEPAG_20260924_010000.bak.gz',
    960604160,
    '916.11 MB',
    '\\192.168.0.27\SqlResBackupAllDB\1. Profit\CVEPAG_20260924_010000.bak.gz'
),
(
    '11111111-1111-1111-1111-111111111111',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '139 seconds',
    139,
    'SUCCESS',
    'FULL',
    'CVEPAG_20260923_010000.bak.gz',
    960604160,
    '916.11 MB',
    '\\192.168.0.27\SqlResBackupAllDB\1. Profit\CVEPAG_20260923_010000.bak.gz'
),
(
    '11111111-1111-1111-1111-111111111111',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '145 seconds',
    145,
    'SUCCESS',
    'FULL',
    'CVEPAG_20260922_010000.bak.gz',
    960509440,
    '916.02 MB',
    '\\192.168.0.27\SqlResBackupAllDB\1. Profit\CVEPAG_20260922_010000.bak.gz'
)
ON CONFLICT DO NOTHING;

COMMIT;
