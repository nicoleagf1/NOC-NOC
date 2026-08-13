import { queryPrometheus, fetchActiveAlerts } from './src/lib/api/prometheusClient.js';
async function test() {
  console.log("Alerts:", await fetchActiveAlerts());
  console.log("CPU:", await queryPrometheus('avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))'));
}
test();
