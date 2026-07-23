BEGIN;

-- ==============================================================================
-- NOC-NOC DATABASE INITIALIZATION SCRIPT (DBA-Grade)
-- ==============================================================================
-- Este script es idempotente (seguro de correr múltiples veces sin romper nada).
-- Se ejecuta dentro de una transacción para garantizar atomicidad: 
-- si algo falla, no se aplica ningún cambio (Rollback automático).
-- ==============================================================================

-- 0. Habilitar extensión nativa para generación de UUID v4 de forma segura
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CREACIÓN DE TABLAS DEL SISTEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS infrastructure_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostname VARCHAR(100) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    environment VARCHAR(20) NOT NULL,
    os_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_monitored BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_host_environment CHECK (environment IN ('PROD', 'STG', 'DEV'))
);

CREATE TABLE IF NOT EXISTS business_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    endpoint_url VARCHAR(255),
    current_status VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    uptime_kuma_monitor_id INTEGER UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_service_status CHECK (current_status IN ('DISPONIBLE', 'DEGRADADO', 'CAÍDO'))
);

CREATE TABLE IF NOT EXISTS incident_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID,
    host_id UUID,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    CONSTRAINT fk_incident_service FOREIGN KEY (service_id) REFERENCES business_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_incident_host FOREIGN KEY (host_id) REFERENCES infrastructure_hosts(id) ON DELETE CASCADE,
    CONSTRAINT fk_incident_user FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_incident_status CHECK (status IN ('ACTIVA', 'EN_PROGRESO', 'RESUELTA')),
    CONSTRAINT chk_incident_severity CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    CONSTRAINT chk_dates_order CHECK (resolved_at >= triggered_at)
);

-- ==========================================
-- 2. INDEXACIÓN AVANZADA (OPTIMIZACIÓN DE CONSULTAS)
-- ==========================================

-- Índices B-Tree para optimización de búsquedas operativas frecuentes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_hosts_environment ON infrastructure_hosts(environment);
CREATE INDEX IF NOT EXISTS idx_services_kuma_id ON business_services(uptime_kuma_monitor_id);

-- Índices compuestos para acelerar el filtrado histórico y el cálculo de KPIs en tiempo real
CREATE INDEX IF NOT EXISTS idx_incidents_active_status ON incident_history(status) WHERE status = 'ACTIVA';
CREATE INDEX IF NOT EXISTS idx_incidents_service_search ON incident_history(service_id, triggered_at);
CREATE INDEX IF NOT EXISTS idx_incidents_host_search ON incident_history(host_id, triggered_at);

-- ==========================================
-- 3. AUTOMATIZACIÓN Y LÓGICA DE NEGOCIO (TRIGGERS)
-- ==========================================

-- Función para actualizar el campo duration_seconds e inyectar el cálculo del MTTR automáticamente
CREATE OR REPLACE FUNCTION fn_calculate_incident_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resolved_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.triggered_at))::INTEGER;
        NEW.status := 'RESUELTA';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminamos el trigger si existe y lo recreamos (idempotencia)
DROP TRIGGER IF EXISTS trg_calculate_duration ON incident_history;
CREATE TRIGGER trg_calculate_duration
BEFORE INSERT OR UPDATE ON incident_history
FOR EACH ROW
EXECUTE FUNCTION fn_calculate_incident_duration();

-- Función para mantener actualizado automáticamente el campo updated_at de los usuarios
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminamos el trigger si existe y lo recreamos (idempotencia)
DROP TRIGGER IF EXISTS trg_update_user_timestamp ON users;
CREATE TRIGGER trg_update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- ==========================================
-- 4. INSERCIÓN DE DATOS SEMILLA (SEEDERS ESENCIALES)
-- ==========================================

-- Usamos ON CONFLICT para asegurar que si corremos el script 2 veces, no tire error por violar unicidad (UNIQUE)
INSERT INTO roles (id, name, description) VALUES 
(1, 'ADMIN', 'Acceso total al sistema, configuración de alertas, administración de nodos e infraestructura y alta de operadores.'),
(2, 'OPERATOR', 'Gestión operativa del NOC, visualización de métricas en tiempo real, reconocimiento de incidentes y aplicación de playbooks.'),
(3, 'VIEWER', 'Acceso de solo lectura para reportaría, análisis histórico de disponibilidad y monitoreo pasivo sin capacidades de modificación.')
ON CONFLICT (name) DO NOTHING;

-- Ajustamos la secuencia para evitar problemas futuros de inserción al forzar IDs fijos
SELECT setval(pg_get_serial_sequence('roles', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM roles;

COMMIT;
