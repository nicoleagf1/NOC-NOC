import { NextResponse } from 'next/server';
import { getGlobalKPIs, getHistoricalCpuUsage, getServiceStatuses, getRecentIncidents, getMonitoredHosts } from '@/lib/services/metricsService';

export const dynamic = 'force-dynamic'; // Asegura que siempre sea en tiempo real

export async function GET() {
  try {
    const [kpis, cpuHistory, services, incidents, hosts] = await Promise.all([
      getGlobalKPIs(),
      getHistoricalCpuUsage(24), // Últimas 24 horas
      getServiceStatuses(),
      getRecentIncidents(5),
      getMonitoredHosts()
    ]);

    // Calcular resúmenes de servicios para el dashboard
    const totalServices = services.length;
    const upServices = services.filter(s => s.status === 'up').length;
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    // Calcular la disponibilidad general en base a los servicios arriba
    const globalAvailability = totalServices > 0 ? (upServices / totalServices) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          ...kpis,
          globalAvailability: globalAvailability.toFixed(2),
          monitoredHosts: hosts.length // Corregido: cuenta hosts, no servicios
        },
        servicesSummary: {
          total: totalServices,
          up: upServices,
          down: downServices,
          degraded: degradedServices
        },
        cpuHistory,
        services,
        incidents,
        hosts
      }
    });
  } catch (error) {
    console.error('Error in /api/metrics/dashboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
