# Módulo de Respaldos Automáticos — NOC-NOC

## Descripción General

El módulo de Respaldos es una extensión integrada en la plataforma NOC-NOC que replica la funcionalidad de herramientas como **SQLBackupAndFTP**, pero con una arquitectura **Agentless** — no requiere instalar software adicional en los servidores de bases de datos remotos.

Soporta tres motores de base de datos:

| Motor | Método de Respaldo | Formato de Salida |
|-------|-------------------|-------------------|
| **Microsoft SQL Server** | `BACKUP DATABASE` (T-SQL nativo) | `.bak` (nativo comprimido) |
| **MySQL** | `mysqldump` vía túnel SSH | `.sql.gz` (gzip streaming) |
| **PostgreSQL** | `pg_dump` vía SSH o TCP directo | `.sql.gz` (gzip streaming) |

---

## Requisitos Previos

### 1. Dependencias de npm

Las siguientes librerías deben estar instaladas en el proyecto. Si clonaste el repositorio y ejecutaste `npm install`, ya están incluidas en `package.json`:

```bash
# Conectores de base de datos
npm install ssh2 mssql

# Compresión
npm install archiver

# Programador de tareas
npm install node-cron

# Tipos TypeScript (desarrollo)
npm install -D @types/ssh2 @types/mssql @types/archiver @types/node-cron
```

### 2. Migración de Base de Datos

Antes de usar el módulo, debes aplicar la migración que crea las tablas `backup_jobs` y `backup_history` en PostgreSQL:

```bash
node database/apply_migration.mjs
```

> **Nota:** Este script lee las credenciales de `.env.local` y aplica `database/04_backup_module_schema.sql`. La función `fn_update_timestamp()` debe existir previamente (se crea en `database/init.sql`).

### 3. Acceso de Red

- **NAS:** El servidor donde corre NOC-NOC debe tener permisos de escritura en la ruta de destino (ej: `\\192.168.0.27\SqlResBackupAllDB\`).
- **SSH:** Para backups de MySQL/PostgreSQL remotos, se requiere acceso SSH al servidor con credenciales (usuario + contraseña). Las credenciales se almacenan cifradas con AES-256-CBC.
- **SQL Server:** El servicio SQL Server debe aceptar conexiones TCP/IP en el puerto configurado (por defecto `1433`).

### 4. Variables de Entorno

No se requieren variables de entorno adicionales. El módulo utiliza las mismas variables existentes del proyecto:

| Variable | Uso en el Módulo |
|----------|-----------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL (tablas del módulo) |
| `APP_SECRET` | Cifrado/descifrado AES-256-CBC de contraseñas de DB y SSH |

---

## Estructura de Archivos

```
noc-noc/
├── database/
│   ├── 04_backup_module_schema.sql   # Migración: tablas, índices, triggers, datos semilla
│   └── apply_migration.mjs          # Script para aplicar la migración
│
├── src/
│   ├── instrumentation.ts           # Auto-arranque del scheduler al iniciar Next.js
│   │
│   ├── types/
│   │   └── backup.ts                # Interfaces TypeScript (BackupJob, BackupHistoryItem)
│   │
│   ├── lib/services/
│   │   ├── backupJobService.ts       # Capa de datos (CRUD de jobs + historial)
│   │   ├── backupEngineService.ts    # Motor principal (MySQL SSH, MSSQL, PostgreSQL)
│   │   ├── backupSchedulerService.ts # Programador cron automático (node-cron)
│   │   └── backupAlertService.ts     # Alertas integradas con NOC + n8n
│   │
│   ├── app/
│   │   ├── (dashboard)/respaldos/
│   │   │   └── page.tsx              # Página frontend (/respaldos)
│   │   │
│   │   └── api/backups/
│   │       ├── jobs/
│   │       │   ├── route.ts                    # GET (listar) + POST (crear)
│   │       │   └── [id]/
│   │       │       ├── route.ts                # GET + PUT + DELETE
│   │       │       ├── run/route.ts            # POST (ejecutar ahora)
│   │       │       ├── history/route.ts        # GET (historial)
│   │       │       └── test-connection/route.ts # POST (probar conexión)
│   │       ├── stats/route.ts                  # GET (KPIs globales)
│   │       └── scheduler/route.ts              # GET (estado) + POST (start/reload/stop)
│   │
│   └── components/layout/
│       └── sidebar.tsx               # (Modificado) Agregado "RESPALDOS" en OPERACIONES
```

---

## Modelo de Datos

### Tabla `backup_jobs`

Almacena la configuración de cada trabajo de respaldo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `UUID` | Identificador único (auto-generado) |
| `name` | `VARCHAR(100)` | Nombre del trabajo (ej: "1.1 Profit") |
| `engine` | `VARCHAR(20)` | Motor: `mssql`, `mysql`, `postgres` |
| `is_active` | `BOOLEAN` | Si el cron está activo |
| `host` | `VARCHAR(255)` | Dirección del servidor de BD |
| `port` | `INTEGER` | Puerto del servicio de BD |
| `database_name` | `VARCHAR(100)` | Nombre de la base de datos |
| `db_username` | `VARCHAR(100)` | Usuario de la BD |
| `db_password_encrypted` | `TEXT` | Contraseña cifrada con AES-256-CBC |
| `use_ssh_tunnel` | `BOOLEAN` | Si usa túnel SSH para la conexión |
| `ssh_host`, `ssh_port`, `ssh_username` | — | Datos del túnel SSH |
| `ssh_password_encrypted` | `TEXT` | Contraseña SSH cifrada |
| `destination_type` | `VARCHAR(20)` | Tipo: `nas`, `local`, `s3` |
| `destination_path` | `TEXT` | Ruta de destino del backup |
| `cron_schedule` | `VARCHAR(50)` | Expresión cron (ej: `0 1 * * *`) |
| `retention_days` | `INTEGER` | Días de retención (auto-limpieza) |
| `compression_format` | `VARCHAR(10)` | Formato: `gzip`, `zip`, `none` |
| `send_alert_on_failure` | `BOOLEAN` | Alertar al NOC si falla |

### Tabla `backup_history`

Registra cada ejecución (exitosa o fallida).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `UUID` | Identificador único |
| `job_id` | `UUID` | Referencia al job (FK → `backup_jobs`) |
| `started_at` | `TIMESTAMPTZ` | Inicio de la ejecución |
| `finished_at` | `TIMESTAMPTZ` | Fin de la ejecución |
| `duration_seconds` | `INTEGER` | Duración total en segundos |
| `status` | `VARCHAR(20)` | `RUNNING`, `SUCCESS`, `FAILED` |
| `file_name` | `VARCHAR(255)` | Nombre del archivo generado |
| `file_size_bytes` | `BIGINT` | Tamaño en bytes |
| `file_size_formatted` | `VARCHAR(20)` | Tamaño legible (ej: "916.11 MB") |
| `error_message` | `TEXT` | Mensaje de error (si falló) |

---

## API REST — Referencia Rápida

Todas las rutas están protegidas por autenticación JWT (cookie `noc_session`).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/backups/jobs` | Listar todos los trabajos con su último estado |
| `POST` | `/api/backups/jobs` | Crear un nuevo trabajo de respaldo |
| `GET` | `/api/backups/jobs/:id` | Detalle de un trabajo |
| `PUT` | `/api/backups/jobs/:id` | Editar un trabajo |
| `DELETE` | `/api/backups/jobs/:id` | Eliminar un trabajo y su historial |
| `POST` | `/api/backups/jobs/:id/run` | Ejecutar un backup manualmente |
| `GET` | `/api/backups/jobs/:id/history` | Historial de ejecuciones (últimas 30) |
| `POST` | `/api/backups/jobs/:id/test-connection` | Probar conectividad a la base de datos |
| `GET` | `/api/backups/stats` | Estadísticas globales (KPIs) |
| `GET` | `/api/backups/scheduler` | Estado actual del programador |
| `POST` | `/api/backups/scheduler` | Controlar el scheduler (`start` / `reload` / `stop`) |

---

## Cómo Funciona

### Flujo de un Respaldo Automático

```
1. El servidor Next.js arranca
2. instrumentation.ts → backupSchedulerService.initialize()
3. Lee todos los jobs activos de la tabla backup_jobs
4. Programa cada job con node-cron según su expresión (ej: "0 1 * * *" = 01:00 AM)
5. Cuando el cron se dispara:
   a. Crea un registro en backup_history (status = RUNNING)
   b. Según el motor:
      • MySQL:  Abre túnel SSH → ejecuta mysqldump → pipe gzip → escribe en NAS
      • MSSQL:  Conecta vía mssql → BACKUP DATABASE [...] TO DISK con compresión
      • Postgres: Abre SSH/directo → pg_dump → pipe gzip → escribe en NAS
   c. Actualiza backup_history con resultado (SUCCESS o FAILED)
   d. Si falló: Crea alerta en alert_incident_history + notifica a n8n
   e. Si éxito: Resuelve alertas previas activas
   f. Aplica política de retención (elimina archivos > N días)
```

### Integración con el Sistema de Alertas

Los fallos de backup se integran con el mismo sistema de alertas que ya usa NOC-NOC para Prometheus:

- Se insertan en la tabla `alert_incident_history` con `service_id = backup-{jobId}`
- Aparecen en la sección **Alertas Activas** del dashboard
- Se despachan vía webhook a **n8n** para notificaciones externas (email, Telegram, etc.)
- Se auto-resuelven cuando el siguiente backup es exitoso

### Seguridad

- Las contraseñas de base de datos y SSH se cifran con **AES-256-CBC** usando `APP_SECRET`
- El frontend nunca recibe contraseñas en texto plano (se envía una máscara `••••••••`)
- Al editar un job, si el frontend envía la máscara, el backend conserva la contraseña original
- Todas las rutas API están protegidas por el middleware JWT existente
