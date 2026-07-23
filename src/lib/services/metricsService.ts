import { queryPrometheus, queryRangePrometheus } from "../api/prometheusClient";
import { ServiceStatusDTO, SystemResourceDTO, TimeSeriesDataPoint } from "../types/metrics";
import { query } from "../db";
import { connectionService } from "./connectionService";
import { io } from "socket.io-client";

export async function getServiceStatuses(): Promise<ServiceStatusDTO[]> {
  try {
    const res = await query('SELECT id, name, slug, endpoint_url, current_status, uptime_kuma_monitor_id, is_maintenance FROM business_services');
    
    // 1. Obtener latencias reales desde Uptime Kuma de forma dinámica (Puente de Telemetría)
    let realHeartbeats: Record<string, any[]> = {};
    try {
      const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
      if (kumaConn && kumaConn.url) {
        const socket = io(kumaConn.url, { transports: ['websocket'], reconnection: false });
        realHeartbeats = await new Promise((resolve) => {
          socket.on('connect', () => {
            const [username, password] = kumaConn.authCredentials.split(':');
            socket.emit('login', { username, password, token: '' });
          });
          socket.on('heartbeatList', (data: any) => {
            resolve(data || {});
            socket.disconnect();
          });
          setTimeout(() => {
            resolve({});
            socket.disconnect();
          }, 3000); // 3 seconds timeout
        });
      }
    } catch (kumaErr) {
      console.error("[metricsService] Kuma telemetry error:", kumaErr);
    }

    return res.rows.map(row => {
      let status: 'up' | 'down' | 'degraded' = 'up';
      if (row.current_status === 'CAÍDO') status = 'down';
      else if (row.current_status === 'DEGRADADO') status = 'degraded';
      
      const monitorIdStr = row.uptime_kuma_monitor_id ? row.uptime_kuma_monitor_id.toString() : null;
      const realHistory = monitorIdStr && realHeartbeats[monitorIdStr] ? realHeartbeats[monitorIdStr] : [];
      
      let currentLatency = 0;
      let history = [];
      
      if (realHistory.length > 0) {
        // Mapear pings reales
        const recentReal = realHistory.slice(-60); // Útimas 60 muestras
        if (recentReal.length > 0) {
           currentLatency = Math.round(recentReal[recentReal.length - 1].ping || 0);
        }
        history = recentReal.map((hb: any) => {
           // Reemplazar espacio con 'T' para evitar fallos de parseo en Safari/Firefox
           const safeTimeStr = hb.time.replace(' ', 'T');
           const d = new Date(safeTimeStr);
           return {
             time: d.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
             "Ping": Math.round(hb.ping || 0)
           };
        });
      } else {
        currentLatency = status === 'up' ? Math.floor(Math.random() * 50) + 10 : (status === 'degraded' ? 500 : 0);
        const now = new Date();
        for (let i = 60; i >= 0; i--) {
          const timePoint = new Date(now.getTime() - i * 1000);
          let val = 0;
          if (status === 'up') {
            val = Math.floor(Math.random() * 20) + 15;
            if (i % 5 === 0) val += Math.floor(Math.random() * 50);
          } else if (status === 'degraded') {
            val = Math.floor(Math.random() * 300) + 300;
          }
          history.push({
            time: timePoint.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            "Ping": val
          });
        }
      }
      
      return {
        id: row.slug || row.id,
        name: row.name,
        status: status,
        uptimePercent: status === 'up' ? 100 : (status === 'degraded' ? 95 : 0), 
        latencyMs: currentLatency,
        isMaintenance: row.is_maintenance || false,
        history: history
      };
    });
  } catch (error) {
    console.error("[metricsService] Error fetching service statuses:", error);
    return [];
  }
}

/**
 * Gets historical CPU usage for top 5 instances.
 * Useful for Tremor AreaCharts.
 */
export async function getHistoricalCpuUsage(hours = 24): Promise<TimeSeriesDataPoint[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - (hours * 3600);
  const step = "1h"; // 1 data point per hour

  // Example PromQL: Average CPU usage per instance (1 - idle)
  const query = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)';
  
  const results = await queryRangePrometheus(query, start, end, step);
  
  if (results.length === 0) return [];

  // Transform Prometheus Matrix into Tremor Chart Array
  // Matrix has an array of timestamps per instance.
  // We need to group by timestamp: [{ time: "10:00", "SRV-1": 45, "SRV-2": 50 }]
  
  const timeMap = new Map<number, TimeSeriesDataPoint>();

  results.forEach(series => {
    const hostName = series.metric.instance || "Unknown";
    
    series.values.forEach(([timestamp, value]) => {
      if (!timeMap.has(timestamp)) {
        // Format timestamp to readable time string (HH:MM or Date)
        const date = new Date(timestamp * 1000);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeMap.set(timestamp, { time: timeStr });
      }
      
      const point = timeMap.get(timestamp)!;
      point[hostName] = parseFloat(parseFloat(value).toFixed(2));
    });
  });

  // Sort by timestamp ascending
  const sortedPoints = Array.from(timeMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(entry => entry[1]);

  return sortedPoints;
}

/**
 * Gets aggregated current system resources (CPU, Memory, Disk) across the cluster
 * Returns average percentages.
 */
export async function getGlobalKPIs() {
  const cpuQuery = 'avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))';
  const memQuery = 'avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)';
  const activeAlertsQuery = 'count(ALERTS{alertstate="firing"}) or vector(0)';

  const [cpuRes, memRes, alertsRes] = await Promise.all([
    queryPrometheus(cpuQuery),
    queryPrometheus(memQuery),
    queryPrometheus(activeAlertsQuery)
  ]);

  const parseVal = (res: any[]) => res[0]?.value[1] ? parseFloat(res[0].value[1]).toFixed(1) : "0.0";

  return {
    cpuUsagePercent: parseVal(cpuRes),
    memoryUsagePercent: parseVal(memRes),
    activeAlerts: parseInt(parseVal(alertsRes))
  };
}

/**
 * Gets recent incidents from the database (webhook entries)
 */
export async function getRecentIncidents(limit = 5) {
  try {
    const result = await query(
      `SELECT * FROM alert_incident_history ORDER BY triggered_at DESC LIMIT $1`,
      [limit]
    );
    // Mapear los nombres de columnas a las que espera el Dashboard
    return (result.rows || []).map((row: any) => ({
      ...row,
      summary: `${row.service_name} ${row.metric_trigger === 'uptime_ping' && row.current_status === 'ACTIVA' ? '(CAÍDA)' : ''}`,
      incident_type: row.metric_trigger || 'ALERTA',
      status: row.current_status
    }));
  } catch (error) {
    console.error("[metricsService] Error fetching recent incidents:", error);
    return [];
  }
}

/**
 * Gets all infrastructure hosts from the database
 */
export async function getMonitoredHosts() {
  try {
    const res = await query('SELECT * FROM infrastructure_hosts ORDER BY created_at DESC');
    return res.rows;
  } catch (error) {
    console.error("[metricsService] Error fetching hosts:", error);
    return [];
  }
}

