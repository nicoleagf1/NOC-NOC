import { getServiceStatuses } from './src/lib/services/metricsService';

async function run() {
  const data = await getServiceStatuses();
  if (data.length > 0) {
     console.log("Got services:", data.length);
     console.log("Service 0 latency:", data[0].latencyMs, "History length:", data[0].history?.length);
  }
  process.exit(0);
}
run();
