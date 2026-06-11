import { queryPrometheus, queryRangePrometheus } from "../api/prometheusClient";
import { ServiceStatusDTO, SystemResourceDTO, TimeSeriesDataPoint } from "../types/metrics";

/**
 * Parses Prometheus UP metric to ServiceStatusDTO
 * Assuming Kuma metrics are exposed with labels like {name="API de Pagos"}
 */
export async function getServiceStatuses(): Promise<ServiceStatusDTO[]> {
  // Query for all services monitored by Kuma. 
  // Adjust the label filter `{job="uptime-kuma"}` according to your prometheus.yml
  const query = 'up{job="uptime-kuma"}';
  const results = await queryPrometheus(query);

  return results.map(result => {
    const isUp = result.value[1] === "1";
    return {
      id: result.metric.instance || result.metric.name || Math.random().toString(),
      name: result.metric.name || result.metric.instance || "Unknown Service",
      status: isUp ? "up" : "down",
      // Dummy values for now since we just queried 'up'
      // Latency and uptime can be fetched with more complex PromQL if needed.
      uptimePercent: isUp ? 100 : 0, 
      latencyMs: 0 
    };
  });
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
