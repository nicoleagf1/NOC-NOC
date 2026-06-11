# Consolidamos absolutamente TODA la información adquirida en las iteraciones anteriores en un único archivo Markdown Maestro.
# Incluye: Resumen ejecutivo, Tabla comparativa, Stack e ingeniería de la opción ganadora, Estructura de carpetas limpia,
# Guía estricta de Look & Feel corporativo de Vepagos, Configuración de archivos core en TypeScript y Estrategia de ingesta de datos.

total_project_document = """# Reporte Maestro del Proyecto: Sistema Centralizado de Monitoreo "NOC-NOC"

Este documento constituye la propuesta formal consolidada, el diseño de arquitectura full stack y el manual de especificaciones técnicas y visuales para el desarrollo e implementación del nuevo Dashboard Centralizado de Monitoreo **NOC-NOC** para el área de Sistemas de Vepagos.

---

## 1. Resumen Ejecutivo y Alcance
Actualmente, el área de Sistemas dispone de herramientas de monitoreo funcionales como **Uptime Kuma** (disponibilidad de servicios) y **Prometheus** (recolección de métricas a través de agentes e exporters). Sin embargo, el control operativo se encuentra fragmentado, obligando al equipo técnico a alternar entre múltiples interfaces y pantallas independientes.

El proyecto **NOC-NOC** tiene como objetivo unificar estas fuentes de datos bajo un enfoque *Single Pane of Glass* (Ventana Única de Control), desarrollado a la medida. Esta solución estratégica permite:
- **Centralización Absoluta:** Integrar la potencia de series temporales de Prometheus con el estado analítico de servicios de Uptime Kuma en tiempo real.
- **Identidad Visual Corporativa:** Cumplir minuciosamente con las especificaciones del manual de marca de Vepagos (radios de curvatura de `14px`, tipografías *Barlow* y botones tipo píldora).
- **Proactividad Avanzada:** Visualizar métricas críticas de infraestructura (CPU, memoria, almacenamiento, latencia e IOPS) junto a un sistema unificado de alertas tempranas para reducir el tiempo de resolución de incidentes (MTTR).

---

## 2. Situación Actual vs. Situación Propuesta

| Característica | Estado Actual (Herramientas Aisladas) | Estado Propuesto (NOC-NOC Centralizado) |
| :--- | :--- | :--- |
| **Visibilidad** | Fragmentada en múltiples pantallas o herramientas. | **Dashboard Único (Single Pane of Glass)** con el estado global e inmediato. |
| **Métricas** | Monitoreo técnico de recursos disperso. | **Métricas profundas correlacionadas** (CPU, RAM, I/O de disco, tráfico de red). |
| **Alertas** | Notificaciones reactivas y aisladas. | **Alertas inteligentes** basadas en webhooks y umbrales dinámicos. |
| **Fidelidad de Marca** | Interfaces por defecto de Grafana/Uptime Kuma. | **Look & Feel Corporativo** estricto alineado al manual de Vepagos. |
| **Diagnóstico** | Requiere revisar servidor por servidor ante fallas. | **Identificación instantánea** de la causa raíz de la degradación del servicio. |

---

## 3. Decisiones de Arquitectura y Stack Tecnológico
Para garantizar la máxima mantenibilidad, rendimiento óptimo y un control estricto sobre el DOM y los estilos tipográficos, se ha seleccionado el desarrollo de una solución a la medida utilizando la **Opción 2 (Next.js + Tailwind CSS + Tremor)**:

- **Ecosistema Core:** **Next.js 14+ (App Router)**. Proporciona renderizado híbrido. Las llamadas pesadas e ingestas iniciales a Prometheus se procesan en el servidor (*Server Components*), protegiendo la carga y la memoria del navegador del operador.
- **Middleware / BFF (Backend For Frontend):** *Route Handlers* nativos de Next.js (`/api/*`). Actúan como una capa intermedia segura; aíslan las IPs internas de infraestructura y tokenizan las consultas de Prometheus para evitar exponer credenciales o lógica de queries PromQL en el cliente.
- **Motor de Estilos:** **Tailwind CSS**. Permite inyectar de manera exacta los tokens de la marca Vepagos de forma global mediante su archivo de configuración nativo.
- **Estructura Analítica:** **Tremor.so**. Librería de componentes UI de código abierto construida sobre Tailwind, optimizada específicamente para la visualización de series temporales, gráficas de áreas y cuadros de mando operativos densos.

---

## 4. Estructura de Carpetas del Proyecto (Clean Architecture)
El proyecto se organizará bajo una arquitectura limpia y modular adaptada al paradigma de Next.js. Esto garantiza la separación de la lógica de negocio de la infraestructura y el diseño visual:]
noc-noc/
├── src/
│   ├── app/                           # Enrutamiento de Next.js (App Router)
│   │   ├── layout.tsx                 # Contenedor global de la app (Inyección de fuentes Barlow)
│   │   ├── page.tsx                   # Vista Principal del NOC (Tablero Unificado en tiempo real)
│   │   ├── login/                     # Módulo de Autenticación Institucional Vepagos
│   │   │   └── page.tsx
│   │   └── api/                       # Capa BFF (Capa de abstracción segura para Backend)
│   │       ├── metrics/               # Conector y parser HTTP para PromQL (Prometheus)
│   │       │   └── route.ts
│   │       └── uptime/                # Receptor de Webhooks y estado de disponibilidad (Uptime Kuma)
│   │           └── route.ts
│   │
│   ├── components/                    # Componentes de Interfaz de Usuario (Diseño Atómico)
│   │   ├── ui/                        # Componentes elementales / primitivas visuales
│   │   │   ├── button.tsx             # Botón corporativo tipo píldora (rounded-full)
│   │   │   ├── card.tsx               # Tarjeta con bordes exactos de 14px y sombra suave
│   │   │   └── badge.tsx              # Etiquetas semánticas de estado operativo
│   │   ├── layout/                    # Componentes estructurales del cascarón visual
│   │   │   ├── sidebar.tsx            # Barra de navegación lateral blanca (Secciones en Uppercase)
│   │   │   └── topbar.tsx             # Barra superior en color Navy institucional
│   │   └── noc/                       # Componentes de negocio exclusivos del monitoreo
│   │       ├── metrics-chart.tsx      # Gráficos analíticos de series temporales (Tremor)
│   │       └── service-status.tsx     # Grilla e indicadores vivos de servicios web
│   │
│   ├── config/                        # Tokens de configuración estática y variables de entorno
│   │   └── constants.ts
│   │
│   ├── hooks/                         # React Hooks personalizados para control de flujo
│   │   └── use-live-metrics.ts        # Control y ciclo de vida del Polling / Refresco en tiempo real
│   │
│   ├── lib/                           # Clientes y utilidades de infraestructura de terceros
│   │   └── prometheus.ts              # Driver HTTP parametrizado para queries Prometheus
│   │
│   ├── styles/                        # Directivas globales de CSS e importaciones base
│   │   └── globals.css
│   │
│   └── types/                         # Tipados e interfaces estrictas de TypeScript
│       └── index.ts
│
├── tailwind.config.ts                 # Archivo de configuración e inyección visual de tokens Vepagos
├── package.json                       # Dependencias del proyecto
└── tsconfig.json                      # Configuración estricta del compilador de TypeScript
