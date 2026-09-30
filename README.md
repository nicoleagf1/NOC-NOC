# NOC-NOC

**Plataforma de Monitoreo y Operaciones de Red** — Centro de Operaciones de Red (NOC) unificado para la gestión de infraestructura, servicios, redes y respaldos.

## Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Frontend | React 19, Tailwind CSS 3, Tremor (charts/KPIs) |
| Base de Datos | PostgreSQL (operacional) + Prometheus (métricas) |
| Autenticación | JWT (jose) + 2FA (otplib) |
| Monitoreo | Prometheus + Uptime Kuma + FortiGate Exporter |
| Automatización | n8n (webhooks) |

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/nicoleagf1/NOC-NOC.git
cd noc-noc

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales reales

# 4. Aplicar migraciones de base de datos
node database/apply_migration.mjs

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Módulos del Sistema

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | KPIs globales, estado de servicios, alertas recientes |
| Servicios | `/servicios` | Monitoreo de servicios de negocio (Uptime Kuma) |
| Infraestructura | `/infraestructura` | CPU, RAM, Disco de servidores (Prometheus) |
| Redes | `/redes` | Throughput WAN, FortiGate, interfaces |
| Eventos | `/eventos` | Bitácora de eventos de infraestructura |
| Alertas | `/alertas/activas` | Alertas activas y historial de incidentes |
| Configuración | `/configuracion` | Usuarios, conexiones, ajustes del sistema |
| Utilidades | `/utilidades` | Herramientas de operaciones |
| Automatización | `/automatizacion` | Workflows n8n integrados |
| **Respaldos** | `/respaldos` | Backups automáticos de bases de datos |

## Módulo de Respaldos

El módulo de respaldos permite programar y ejecutar backups automáticos de bases de datos **Microsoft SQL Server**, **MySQL** y **PostgreSQL** con una arquitectura agentless (sin instalar software en los servidores remotos).

**Documentación completa:** [modulo_respaldos.md](modulo_respaldos.md)

### Dependencias adicionales del módulo

```bash
npm install ssh2 mssql archiver node-cron
npm install -D @types/ssh2 @types/mssql @types/archiver @types/node-cron
```

### Migración requerida

```bash
node database/apply_migration.mjs
```

## Estructura del Proyecto

```
noc-noc/
├── database/                    # Scripts SQL de migración
├── public/                      # Assets estáticos (logos, imágenes)
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # Páginas protegidas (layout con sidebar)
│   │   ├── api/                 # API Routes (REST endpoints)
│   │   └── login/               # Página de autenticación
│   ├── components/              # Componentes React reutilizables
│   ├── lib/
│   │   ├── api/                 # Clientes (Prometheus, etc.)
│   │   ├── services/            # Servicios de negocio (backend)
│   │   ├── security.ts          # Cifrado AES-256-CBC
│   │   └── db.ts                # Pool de conexiones PostgreSQL
│   ├── types/                   # Interfaces TypeScript
│   └── instrumentation.ts       # Inicialización de servicios de fondo
├── compose.yml                  # Docker Compose (producción)
├── modulo_respaldos.md          # Documentación del módulo de respaldos
└── estructura_db.md             # Diseño del modelo de datos
```

## Variables de Entorno

```env
DB_HOST=192.168.0.110
DB_PORT=5432
DB_NAME=noc-noc
DB_USER=administrador
DB_PASSWORD=<contraseña>
APP_SECRET=<64 caracteres hexadecimales para cifrado AES-256>
PROMETHEUS_WEBHOOK_SECRET=<token para webhooks de Alertmanager>
```

## Despliegue en Producción

```bash
# Con Docker Compose
docker compose up -d

# Sin Docker
npm run build
npm start
```

El servicio se expone en el puerto `3000` (mapeado a `8092` en producción vía Docker).

