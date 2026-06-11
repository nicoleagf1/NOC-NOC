import { 
  PrometheusResponse, 
  PrometheusVectorResult, 
  PrometheusMatrixResult 
} from "../types/metrics";

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "http://localhost:9090";

/**
 * Base generic fetch for Prometheus API.
 * Uses Next.js native fetch for caching features.
 */
async function fetchPrometheus<T>(endpoint: string, params: URLSearchParams, revalidateSeconds = 15): Promise<PrometheusResponse<T>> {
  const url = `${PROMETHEUS_URL}/api/v1/${endpoint}?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache configuration: stale-while-revalidate pattern
      next: { revalidate: revalidateSeconds }
    });

    if (!response.ok) {
      console.error(`[Prometheus HTTP Error] ${response.status} ${response.statusText} at ${url}`);
      return { status: "error", error: `HTTP ${response.status}` };
    }

    const data: PrometheusResponse<T> = await response.json();
    return data;
  } catch (error: any) {
    console.error(`[Prometheus Fetch Error] ${error.message}`);
    return { status: "error", error: error.message };
  }
}

/**
 * Executes a PromQL query for instant evaluation.
 * Ideal for current CPU, RAM, or Up status.
 */
export async function queryPrometheus(query: string): Promise<PrometheusVectorResult[]> {
  const params = new URLSearchParams({ query });
  const response = await fetchPrometheus<PrometheusVectorResult[]>("query", params);
  
  if (response.status === "success" && response.data?.result) {
    return response.data.result;
  }
  return []; // Graceful degradation on failure
}

/**
 * Executes a PromQL query over a range of time.
 * Ideal for Tremor AreaCharts and LineCharts.
 * 
 * @param query PromQL query string
 * @param start Start timestamp in seconds
 * @param end End timestamp in seconds
 * @param step Resolution step (e.g., '15s', '1m', '1h')
 */
export async function queryRangePrometheus(
  query: string, 
  start: number, 
  end: number, 
  step: string
): Promise<PrometheusMatrixResult[]> {
  const params = new URLSearchParams({
    query,
    start: start.toString(),
    end: end.toString(),
    step
  });
  
  const response = await fetchPrometheus<PrometheusMatrixResult[]>("query_range", params, 60); // Cache for 60s for historical data
  
  if (response.status === "success" && response.data?.result) {
    return response.data.result;
  }
  return []; // Graceful degradation
}
