# Estrategia de Recolección y Agentes

[cite_start]Este archivo define la arquitectura de recolección de datos y los agentes encargados de alimentar el backend del NOC-NOC[cite: 245].

## 1. Ecosistema de Datos y Agentes

* [cite_start]**Infraestructura Base:** Toda la capa de datos e infraestructura está corriendo con Prometheus (y recolectando con agentes/exporters)[cite: 246].
* [cite_start]**Colector de Datos (Backend):** Implementación de Prometheus como base de datos de series temporales para recolectar las métricas detalladas de los servidores mediante agentes ligeros (exporters)[cite: 247].
* [cite_start]**Gestión de Alertas:** Integración con canales de comunicación del equipo (ej. Telegram, Slack o correo electrónico) para notificaciones críticas inmediatas[cite: 248].

## 2. Integración en Next.js (BFF)

* [cite_start]**Prometheus Core Integration:** En la capa de servicio (src/lib/prometheus.ts) se centralizan las llamadas Axios/Fetch hacia la API de consulta de Prometheus (/api/v1/query_range)[cite: 249]. [cite_start]Las sentencias complejas de PromQL para monitorear CPU, memoria e IOPS de disco quedan encapsuladas en este backend interno aislándolo del navegador[cite: 250].
* [cite_start]**Uptime Kuma Webhook Proxy:** El enrutador BFF de Next.js (src/app/api/uptime/route.ts) actúa como un receptor pasivo (Webhook)[cite: 251]. [cite_start]Al detectar un cambio de estado enviado por Uptime Kuma, este procesa los metadatos y emite un evento en tiempo real para actualizar de inmediato la grilla de servicios en la pantalla operativa sin requerir recargas totales de página[cite: 252].
