export type PromQLResultType = "matrix" | "vector" | "scalar" | "string";

export interface PrometheusMetric {
  [key: string]: string;
}

// Result format for 'query' (instant vector)
export interface PrometheusVectorResult {
  metric: PrometheusMetric;
  value: [number, string]; // [timestamp, "value"]
}

// Result format for 'query_range' (range vector)
export interface PrometheusMatrixResult {
  metric: PrometheusMetric;
  values: [number, string][]; // Array of [timestamp, "value"]
}

export interface PrometheusResponse<T = PrometheusVectorResult[] | PrometheusMatrixResult[]> {
  status: "success" | "error";
  errorType?: string;
  error?: string;
  data?: {
    resultType: PromQLResultType;
    result: T;
  };
}

// ----------------------------------------------------
// DTOs (Data Transfer Objects) for Frontend Consumption
// ----------------------------------------------------

export interface ServiceStatusDTO {
  id: string;
  name: string;
  status: "up" | "down" | "degraded";
  uptimePercent: number;
  latencyMs: number;
  isMaintenance?: boolean;
  history?: { time: string; value: number }[]; // ECG data
}

export interface SystemResourceDTO {
  host: string;
  cpuUsage: number;    // 0 - 100
  memoryUsage: number; // 0 - 100
  diskUsage: number;   // 0 - 100
}

export interface TimeSeriesDataPoint {
  time: string; // Formatted time string, e.g., "10:00"
  [key: string]: string | number; // e.g., "SRV-01": 45
}
