# Let's create the requested file: estructura_db.md
# Based on the user's uploaded information and context, we will generate the comprehensive database structure document.

estructura_db_content = """# Diseño y Estructura de Base de Datos relacional para la Plataforma NOC-NOC

Este documento detalla la especificación formal del modelo relacional (RDBMS) utilizando **PostgreSQL** para dar soporte operativo, auditoría histórica, métricas de disponibilidad y gestión de usuarios en la plataforma de monitoreo unificada **NOC-NOC**.

---

## 1. Estrategia y Paradigma de Persistencia (Arquitectura Híbrida)

El sistema NOC-NOC implementa una arquitectura híbrida para garantizar la máxima eficiencia en la persistencia de datos sin incurrir en redundancias costosas:

1. **Base de Datos Métrica y de Series Temporales (TSDB):** Se mantiene **Prometheus** de manera externa y desacoplada. Esta capa almacena de forma optimizada las series temporales puras de rendimiento físico y de infraestructura (métricas brutas de porcentaje de uso de CPU, consumo de memoria RAM, tasas de throughput de red, I/O en disco, etc.). Las consultas complejas sobre estos datos se realizan en tiempo real mediante *PromQL* a través del patrón BFF (*Backend For Frontend*) integrado en Next.js.
2. **Base de Datos Operacional y Relacional (RDBMS):** Se implementa **PostgreSQL** para centralizar los datos que requieren integridad referencial estricta, cumplimiento ACID y capacidades transaccionales complejas. Esto abarca el control de usuarios, la bitácora de auditoría de los operadores, el catálogo de inventario de infraestructura, los servicios del negocio, el historial consolidado de incidentes operativos y el cálculo exacto de métricas clave de la industria como el **MTTR** (*Mean Time To Resolution*) y **MTBF** (*Mean Time Between Failures*).

---

## 2. Diccionario de Datos y Tablas del Modelo Operacional

A continuación se definen de forma precisa cada una de las tablas del sistema operativo PostgreSQL, incluyendo tipos de datos, restricciones de integridad, llaves primarias (PK), llaves foráneas (FK) y valores por defecto.

### 2.1. Tabla: `roles`
Catálogo estricto para definir los niveles de acceso dentro del Centro de Operaciones de Red (NOC).

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador único autoincremental del rol. |
| `name` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Nombre identificador del rol (`ADMIN`, `OPERATOR`, `VIEWER`). |
| `description` | `TEXT` | `NULL` | Detalle explicativo de los permisos asociados al rol. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

### 2.2. Tabla: `users`
Almacenamiento seguro de las credenciales, perfiles y estados de activación de los operadores del NOC.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador universal único del usuario. |
| `role_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY REFERENCES roles(id)` | Llave foránea que asocia el nivel de acceso del usuario. |
| `username` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Nombre de usuario único para la autenticación en la plataforma. |
| `email` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Correo electrónico corporativo oficial. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Contraseña cifrada utilizando algoritmos robustos de hashing (ej. bcrypt). |
| `first_name` | `VARCHAR(50)` | `NOT NULL` | Nombre del colaborador. |
| `last_name` | `VARCHAR(50)` | `NOT NULL` | Apellido del colaborador. |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Estado lógico para habilitar o inhabilitar el acceso de forma inmediata. |
| `last_login_at` | `TIMESTAMP` | `NULL` | Historial de la última sesión exitosa del usuario. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora de registro inicial. |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Control de actualizaciones de datos de perfil. |

### 2.3. Tabla: `infrastructure_hosts`
Inventario técnico de los activos físicos, virtuales o instancias cloud que soportan las plataformas tecnológicas de la corporación.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador único del host de infraestructura. |
| `hostname` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre de red canónico del servidor (ej. `srv-prod-db-01`). |
| `ip_address` | `INET` | `NOT NULL` | Dirección IP del host validada nativamente por PostgreSQL. |
| `environment` | `VARCHAR(20)` | `NOT NULL` | Entorno al que pertenece (`PROD`, `STG`, `DEV`). |
| `os_type` | `VARCHAR(50)` | `NOT NULL` | Sistema operativo instalado (ej. `Ubuntu 24.04 LTS`, `RHEL 9.2`). |
| `description` | `TEXT` | `NULL` | Información de contexto sobre la finalidad del servidor. |
| `is_monitored` | `BOOLEAN` | `DEFAULT TRUE` | Interruptor operativo para activar/desactivar alertas de telemetría. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Fecha de alta en la plataforma de monitoreo. |

### 2.4. Tabla: `business_services`
Catálogo unificado de los servicios críticos del negocio que son expuestos hacia los clientes. Se alimenta de forma pasiva a través de los eventos e integraciones externas de Uptime Kuma.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador único transaccional del servicio. |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre comercial/técnico del servicio (ej. `API Gateway Pasarela`). |
| `slug` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Identificador simplificado para URLs y mapeo de Webhooks externos. |
| `endpoint_url` | `VARCHAR(255)` | `NULL` | Dirección URL externa de monitoreo de salud (Health-check). |
| `current_status` | `VARCHAR(20)` | `DEFAULT 'DISPONIBLE'` | Estado operativo actual en tiempo real (`DISPONIBLE`, `DEGRADADO`, `CAÍDO`). |
| `uptime_kuma_monitor_id` | `INTEGER` | `NULL`, `UNIQUE` | Identificador de mapeo directo enviado por el Webhook de Uptime Kuma. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registro histórico de alta del servicio. |

### 2.5. Tabla: `incident_history`
Registro histórico, auditable e inmutable de las incidencias del sistema. Es la fuente de la verdad transaccional para calcular la disponibilidad operacional del negocio.

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador único de la incidencia. |
| `service_id` | `UUID` | `NULL`, `FOREIGN KEY REFERENCES business_services(id)` | Asociación directa si la falla afectó a un servicio crítico. |
| `host_id` | `UUID` | `NULL`, `FOREIGN KEY REFERENCES infrastructure_hosts(id)` | Asociación directa si la falla se originó en un host de infraestructura. |
| `incident_type` | `VARCHAR(50)` | `NOT NULL` | Clasificación de la alerta (`DOWNTIME_SERVICE`, `HIGH_CPU_USAGE`, `DISK_FULL`). |
| `severity` | `VARCHAR(20)` | `NOT NULL` | Nivel de impacto asignado de forma dinámica (`CRITICAL`, `WARNING`, `INFO`). |
| `summary` | `TEXT` | `NOT NULL` | Descripción técnica clara del evento detectado por los agentes. |
| `status` | `VARCHAR(20)` | `DEFAULT 'ACTIVA'` | Ciclo de vida de la incidencia (`ACTIVA`, `EN_PROGRESO`, `RESUELTA`). |
| `triggered_at` | `TIMESTAMP` | `NOT NULL` | Timestamp exacto en el que ocurrió el incidente en los monitores. |
| `acknowledged_at` | `TIMESTAMP` | `NULL` | Timestamp exacto en el que un operador tomó el control del evento. |
| `acknowledged_by` | `UUID` | `NULL`, `FOREIGN KEY REFERENCES users(id)` | Operador del NOC responsable que reconoció y atiende la falla. |
| `resolved_at` | `TIMESTAMP` | `NULL` | Timestamp exacto de resolución del incidente (vuelta a la normalidad). |
| `duration_seconds` | `INTEGER` | `NULL` | Campo calculado automáticamente de forma transaccional (`resolved_at - triggered_at`). |

---

## 3. Script SQL de Inicialización (DDL Estricto)

A continuación, se detalla el código SQL nativo para PostgreSQL. Incluye la creación de esquemas, relaciones, llaves, índices de optimización y automatismos mediante funciones y disparadores (*triggers*).

```sql
-- Habilitar extensión nativa para generación de UUID v4 de forma segura
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CREACIÓN DE TABLAS DEL SISTEMA
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
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

CREATE TABLE infrastructure_hosts (
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

CREATE TABLE business_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    endpoint_url VARCHAR(255),
    current_status VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    uptime_kuma_monitor_id INTEGER UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_service_status CHECK (current_status IN ('DISPONIBLE', 'DEGRADADO', 'CAÍDO'))
);

CREATE TABLE incident_history (
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
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_hosts_environment ON infrastructure_hosts(environment);
CREATE INDEX idx_services_kuma_id ON business_services(uptime_kuma_monitor_id);

-- Índices compuestos para acelerar el filtrado histórico y el cálculo de KPIs en tiempo real
CREATE INDEX idx_incidents_active_status ON incident_history(status) WHERE status = 'ACTIVA';
CREATE INDEX idx_incidents_service_search ON incident_history(service_id, triggered_at);
CREATE INDEX idx_incidents_host_search ON incident_history(host_id, triggered_at);

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

CREATE TRIGGER trg_update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- ==========================================
-- 4. INSERCIÓN DE DATOS SEMILLA (SEEDERS ESENCIALES)
-- ==========================================

INSERT INTO roles (name, description) VALUES 
('ADMIN', 'Acceso total al sistema, configuración de alertas, administración de nodos e infraestructura y alta de operadores.'),
('OPERATOR', 'Gestión operativa del NOC, visualización de métricas en tiempo real, reconocimiento de incidentes y aplicación de playbooks.'),
('VIEWER', 'Acceso de solo lectura para reportaría, análisis histórico de disponibilidad y monitoreo pasivo sin capacidades de modificación.');