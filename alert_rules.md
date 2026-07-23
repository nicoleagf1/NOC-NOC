# Especificación Técnica: Reglas de Configuración de Alertas (alert_rules.md)

Este documento define las políticas, umbrales lógicos y reglas matemáticas (PromQL) que gobiernan el sistema de alertas del NOC-NOC de Vepagos. Su objetivo es garantizar la proactividad del equipo y la consistencia con la semántica operativa de la empresa.

---

## 1. Clasificación y Semántica de Severidad (NOC-NOC Standard)

Para mapear de forma idéntica la semántica visual de Vepagos en los canales de Telegram y en el Dashboard, clasificamos las alertas en tres niveles estrictos:

| Nivel | Severidad | Color / Badge | Criterio Operativo | Acción en n8n / Canal |
| :--- | :--- | :--- | :--- | :--- |
| **Info** | Informativa | 🔵 Navy (`#001F60`) | Cambios de estado controlados o despliegues. | Log en base de datos. |
| **Warning** | Preventiva | 🟡 Ámbar (`#00CE7C` / Mix) | Recursos cerca del límite. Comportamiento inusual. | Canal `#noc-alerts-warning` |
| **Critical** | Crítica | 🔴 Rojo (`#00B36C` / Error) | Interrupción de servicio o degradación severa. | Canal `#noc-alerts-critical` + Mención `@oncall` |

---

## 2. Reglas de Infraestructura (Prometheus / PromQL Core)

Estas reglas se inyectan en el archivo de configuración `alert.rules.yml` de Prometheus. Están diseñadas para evitar falsos positivos provocados por picos de rendimiento transitorios usando ventanas de tiempo (`for`).

### A. Saturación de CPU (Capacidad de Cómputo)
* **Alerta Preventiva (Warning):** El uso de CPU supera el 80% de forma sostenida durante 5 minutos.
    ```yaml
    expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    ```
* **Alerta Crítica (Critical):** El uso de CPU supera el 92% durante 3 minutos (Riesgo inminente de *OOM Killer* o encolamiento de peticiones).
    ```yaml
    expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 92
    for: 3m
    labels:
      severity: critical
    ```

### B. Agotamiento de Memoria RAM
* **Alerta Preventiva (Warning):** Memoria disponible menor al 15% durante 5 minutos.
    ```yaml
    expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 15
    for: 5m
    labels:
      severity: warning
    ```
* **Alerta Crítica (Critical):** Memoria disponible menor al 5% (El sistema operativo está a punto de colapsar).
    ```yaml
    expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 5
    for: 1m
    labels:
      severity: critical
    ```

### C. Alertas Predictivas de Almacenamiento (Disco)
En lugar de alertar cuando el disco se llene al 90%, aplicamos **análisis predictivo lineal** (`predict_linear`). Esto nos avisa si, al ritmo de escritura actual, el disco se llenará por completo en las próximas 24 horas.
* **Alerta Crítica (Predictiva):** El espacio de disco se agotará en menos de 24 horas.
    ```yaml
    expr: predict_linear(node_filesystem_free_bytes{mountpoint="/"}[4h], 86400) < 0
    for: 10m
    labels:
      severity: critical
    ```

### D. Caída de Nodos (Disponibilidad de Agentes)
* **Alerta Crítica (Node Down):** El agente `node_exporter` no responde al raspado (Scrape) de Prometheus.
    ```yaml
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    ```

---

## 3. Reglas de Disponibilidad de Servicios (Uptime Kuma)

Uptime Kuma monitorea la capa transaccional externa mediante pings y peticiones HTTP periódicas.

* **Regla de Reintentos (Anti-Falsos Positivos):** Ningún servicio debe alertar al primer fallo de conexión de red. Se configuran **3 reintentos con un intervalo de 20 segundos** en la interfaz de Uptime Kuma antes de disparar el Webhook hacia el BFF.
* **Regla de Latencia (Degradación de Servicio):** Si el tiempo de respuesta (Response Time) de una API crítica (ej. API Gateway) supera los **1500ms** en 5 comprobaciones consecutivas, se categoriza como estado **DEGRADADO (Warning)**.

---

## 4. Flujo de Control y Filtrado en el Orquestador (n8n Lógica)

El workflow `n8n_workflow.json` debe implementar las siguientes tres reglas lógicas en su nodo de código JavaScript intermedio antes de enviar a Telegram:

1.  **Deduplicación:** Si una alerta crítica de Prometheus ya fue enviada en los últimos 15 minutos, n8n debe descartar el envío duplicado para no saturar al operador.
2.  **Cálculo de MTTR Automatizado:** Cuando el estado cambia a `OK` (Servicio Restablecido), n8n debe interceptar la marca de tiempo original y calcular la diferencia exacta. El mensaje de Telegram debe verse estructurado así de forma obligatoria:
    * `🟢 [NOC-NOC] - SERVICIO RESTABLECIDO`
    * `Tiempo de Recuperación (MTTR): 4m 12s`
3.  **Sanitización HTML:** Escapar de forma estricta caracteres especiales (`<`, `>`, `&`) para prevenir fallas de parsing de la API de Telegram.

---

## 5. Matriz de Escalabilidad Operativa

Si una alerta **Crítica** enviada al canal de Telegram no es atendida (no hay interacción o cambio de estado a `EN_PROGRESO` en la base de datos PostgreSQL) en un lapso de **15 minutos**, n8n ejecutará un segundo webhook disparando una llamada telefónica automatizada (vía Twilio/Asterisk) o una notificación SMS al Ingeniero On-Call de soporte de segundo nivel.