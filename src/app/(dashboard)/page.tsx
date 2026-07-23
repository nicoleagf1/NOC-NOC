"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, DonutChart } from "@tremor/react";
import { 
  CheckCircle2, 
  XCircle, 
  BellRing, 
  TrendingUp, 
  Server,
  ShieldCheck,
  Clock,
  Loader2,
  AlertTriangle,
  Globe
} from "lucide-react";

export default function DashboardPage() {
  // Tremor Tailwind v4 Safelist (Force generation of dynamic classes)
  // stroke-emerald-500 fill-emerald-500 bg-emerald-500 text-emerald-500
  // stroke-red-500 fill-red-500 bg-red-500 text-red-500
  // stroke-indigo-500 fill-indigo-500 bg-indigo-500 text-indigo-500
  // stroke-cyan-500 fill-cyan-500 bg-cyan-500 text-cyan-500
  // stroke-gray-500 fill-gray-500 bg-gray-500 text-gray-500
  // stroke-amber-500 fill-amber-500 bg-amber-500 text-amber-500
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedEcgService, setSelectedEcgService] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/metrics/dashboard");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
        setLastUpdate(new Date());
        if (!selectedEcgService && json.data.services && json.data.services.length > 0) {
          setSelectedEcgService(json.data.services[0].id);
        }
      } else {
        throw new Error(json.error || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-vepagos-green" />
        <span className="ml-3 font-bold text-gray-500 uppercase tracking-widest">Cargando métricas...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-red-500">
        <XCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold uppercase">Error de Conexión</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Preparar datos para los charts
  const donutServicesData = [
    { name: "Activos", value: data?.servicesSummary?.up || 0, color: "emerald-500" },
    { name: "Caídos", value: data?.servicesSummary?.down || 0, color: "red-500" },
    { name: "Degradados", value: data?.servicesSummary?.degraded || 0, color: "amber-500" },
  ];

  const activeAlertsCount = data?.kpis?.activeAlerts || 0;
  const donutAlertsData = [
    { name: "Críticas", value: activeAlertsCount, color: "red-500" },
    { name: "Advertencias", value: 0, color: "amber-500" }, // Simulado si Prometheus no lo divide
  ];

  const upPercent = data?.servicesSummary?.total > 0 
    ? ((data.servicesSummary.up / data.servicesSummary.total) * 100).toFixed(1) 
    : "0";
    
  const downPercent = data?.servicesSummary?.total > 0 
    ? ((data.servicesSummary.down / data.servicesSummary.total) * 100).toFixed(1) 
    : "0";

  // Preparar datos de Hosts
  const hosts = data?.hosts || [];
  const prodHosts = hosts.filter((h: any) => h.environment?.toLowerCase() === 'producción' || h.environment?.toLowerCase() === 'produccion').length;
  const devHosts = hosts.filter((h: any) => h.environment?.toLowerCase() === 'desarrollo' || h.environment?.toLowerCase() === 'dev').length;
  const otherHosts = hosts.length - prodHosts - devHosts;
  
  const donutHostsData = [
    { name: "Producción", value: prodHosts, color: "indigo-500" },
    { name: "Desarrollo", value: devHosts, color: "cyan-500" },
    { name: "Otros", value: otherHosts, color: "gray-400" },
  ].filter(item => item.value > 0);

  // Obtenemos los nombres dinámicos de los hosts para las series del chart de CPU
  const cpuCategories = data?.cpuHistory && data.cpuHistory.length > 0
    ? Object.keys(data.cpuHistory[0]).filter(k => k !== 'time')
    : [];

  return (
    <div className="space-y-6 pb-20 relative animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vista general del estado operativo de la plataforma
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Clock className="w-4 h-4 mr-2 text-vepagos-navy" />
          <span>{lastUpdate.toLocaleTimeString()}</span>
          <span className="mx-2">|</span>
          <span>{lastUpdate.toLocaleDateString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* Card 0: Servicios Totales */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Servicios Web</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-navy">{data?.servicesSummary?.total || 0}</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase mt-auto pt-4">Endpoints Activos</div>
        </Card>

        {/* Card 1 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Servicios Activos</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-vepagos-green" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-green">{data?.servicesSummary?.up || 0}</div>
              <div className="text-[10px] text-vepagos-green bg-vepagos-green/10 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold">
                {upPercent}%
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">Del Total</div>
        </Card>

        {/* Card 2 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Servicios Caídos</div>
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data?.servicesSummary?.down > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <XCircle className={`w-6 h-6 ${data?.servicesSummary?.down > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${data?.servicesSummary?.down > 0 ? 'text-red-500' : 'text-gray-400'}`}>{data?.servicesSummary?.down || 0}</div>
              <div className={`text-[10px] px-2 py-0.5 rounded-sm inline-block mt-1 font-bold ${data?.servicesSummary?.down > 0 ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                {downPercent}%
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">Del Total</div>
        </Card>

        {/* Card 3 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Alertas Activas</div>
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeAlertsCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <BellRing className={`w-6 h-6 ${activeAlertsCount > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${activeAlertsCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{activeAlertsCount}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold mt-3 text-right">
            <span className="text-red-500">CRÍTICAS: {activeAlertsCount}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-amber-500">ADVERT: 0</span>
          </div>
        </Card>

        {/* Card 4 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Disponibilidad Global</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-vepagos-green" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-green">{data?.kpis?.globalAvailability}%</div>
              <div className="text-[10px] text-vepagos-green bg-vepagos-green/10 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold">ACTUAL</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">En Vivo</div>
        </Card>

        {/* Card 5 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Hosts Monitoreados</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Server className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-navy">{data?.kpis?.monitoredHosts || 0}</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase mt-auto pt-4">Todos Los Sistemas</div>
        </Card>
      </div>

      {/* ECG Widget Grid */}
      <div className="grid grid-cols-1 gap-6 mt-6 pb-12">
        <Card className="p-6 col-span-1 !bg-vepagos-navy !text-white overflow-hidden relative !border-vepagos-navy">
          {/* Subtle Grid Background for ECG feel */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
            <div>
              <h2 className="text-sm font-bold text-vepagos-green uppercase tracking-wider flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Monitor ECG de Latencia (Tiempo Real Simulado)
              </h2>
              <p className="text-xs text-gray-400 mt-1">Historial de latidos por servicio web</p>
            </div>
            
            {data?.services && data.services.length > 0 && (
              <select 
                className="mt-4 md:mt-0 bg-white/10 border border-white/20 text-white text-sm rounded-md p-2 outline-none focus:border-vepagos-green"
                value={selectedEcgService || ''}
                onChange={(e) => setSelectedEcgService(e.target.value)}
              >
                {data.services.map((s: any) => (
                  <option key={s.id} value={s.id} className="bg-vepagos-navy">
                    {s.name} ({s.status.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-[250px] w-full relative z-10">
            {data?.services && selectedEcgService ? (
              (() => {
                const service = data.services.find((s: any) => s.id === selectedEcgService);
                if (!service || !service.history) {
                  return <div className="flex h-full items-center justify-center text-gray-400">Sin datos de telemetría...</div>;
                }
                
                const isDown = service.status === 'down';
                const color = isDown ? 'red' : 'emerald';
                
                return (
                  <div className="h-full flex flex-col relative">
                    <div className="absolute top-0 right-4 text-right">
                      <div className={`text-3xl font-bold font-mono animate-pulse ${isDown ? 'text-red-500' : 'text-vepagos-green'}`}>
                        {service.latencyMs} <span className="text-sm">ms</span>
                      </div>
                      <div className={`text-[10px] uppercase font-bold tracking-widest ${isDown ? 'text-red-500' : 'text-vepagos-green'}`}>
                        {service.status}
                      </div>
                    </div>
                    
                    <LineChart
                      className="h-full mt-4"
                      data={service.history}
                      index="time"
                      categories={["Ping"]}
                      colors={[color]}
                      showLegend={false}
                      showYAxis={false}
                      showXAxis={true}
                      showGridLines={false}
                      showAnimation={true}
                      curveType="monotone"
                      autoMinValue={false}
                      minValue={0}
                      yAxisWidth={40}
                      customTooltip={({ payload, active }: any) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="bg-gray-900 border border-gray-800 p-2 rounded shadow-xl text-white text-xs font-mono">
                            {payload[0].payload.time}: <span className={isDown ? "text-red-500" : "text-vepagos-green"}>{payload[0].value} ms</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                );
              })()
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                Esperando conexión al servicio...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Estado General */}
        <Card className="p-6 col-span-1 flex flex-col">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Estado General de la Operación</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Big Status Circle */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <div className={`absolute inset-0 rounded-full border-8 ${data?.servicesSummary?.down > 0 ? 'border-red-500/20' : 'border-vepagos-green/20'}`}></div>
              <div className={`absolute inset-2 rounded-full border-8 ${data?.servicesSummary?.down > 0 ? 'border-red-500/40' : 'border-vepagos-green/40'}`}></div>
              <div className={`absolute inset-4 rounded-full border-8 flex items-center justify-center bg-white ${data?.servicesSummary?.down > 0 ? 'border-red-500' : 'border-vepagos-green'}`}>
                {data?.servicesSummary?.down > 0 ? (
                  <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-12 h-12 text-vepagos-green" />
                )}
              </div>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 uppercase ${data?.servicesSummary?.down > 0 ? 'text-red-500' : 'text-vepagos-green'}`}>
              {data?.servicesSummary?.down > 0 ? 'Incidentes Activos' : 'Operación Saludable'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {data?.servicesSummary?.down > 0 
                ? `Existen ${data.servicesSummary.down} servicios caídos actualmente.` 
                : 'Todos los sistemas críticos se encuentran operando correctamente.'}
            </p>
            
            <div className="flex space-x-2 w-full">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Uso CPU Avg</div>
                <div className="text-sm font-bold text-vepagos-navy">{data?.kpis?.cpuUsagePercent || "0.0"}%</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Memoria Avg</div>
                <div className="text-sm font-bold text-vepagos-navy">{data?.kpis?.memoryUsagePercent || "0.0"}%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* CPU Chart (Prometheus Data) */}
        <Card className="p-6 col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Uso de CPU (Últimas 24 Horas)</h2>
            <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
              PROMETHEUS
            </div>
          </div>
          <div className="flex-1 h-[250px]">
            {data?.cpuHistory && data.cpuHistory.length > 0 ? (
              <LineChart
                className="h-full mt-4"
                data={data.cpuHistory}
                index="time"
                categories={cpuCategories}
                valueFormatter={(number) => `${number}%`}
                yAxisWidth={40}
                showLegend={true}
                minValue={0}
                maxValue={100}
                colors={["emerald", "blue", "amber", "rose", "indigo", "cyan"]}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                Sin datos suficientes de Prometheus para graficar (job: node_exporter)
              </div>
            )}
          </div>
        </Card>
        
        {/* Estado de Servicios Donut */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Estado de Servicios</h2>
          <div className="flex items-center justify-between">
            <div className="w-1/2 flex justify-center">
              <DonutChart
                className="h-32 w-32"
                data={donutServicesData}
                category="value"
                index="name"
                colors={["emerald", "red", "amber"]}
                showAnimation={true}
              />
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-vepagos-green mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Activos</span></div>
                <span className="text-xs text-gray-500">{data?.servicesSummary?.up || 0} ({upPercent}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Degradados</span></div>
                <span className="text-xs text-gray-500">{data?.servicesSummary?.degraded || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Caídos</span></div>
                <span className="text-xs text-gray-500">{data?.servicesSummary?.down || 0} ({downPercent}%)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Alertas Donut */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Alertas por Nivel (Prometheus)</h2>
          <div className="flex items-center justify-between">
            <div className="w-1/2 flex justify-center">
              <DonutChart
                className="h-32 w-32"
                data={donutAlertsData}
                category="value"
                index="name"
                colors={["red", "amber"]}
                showAnimation={true}
              />
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Críticas</span></div>
                <span className="text-xs text-gray-500">{activeAlertsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Advertencias</span></div>
                <span className="text-xs text-gray-500">0</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Distribución de Hosts Donut */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Hosts por Ambiente</h2>
          <div className="flex items-center justify-between">
            <div className="w-1/2 flex justify-center">
              {donutHostsData.length > 0 ? (
                <DonutChart
                  className="h-32 w-32"
                  data={donutHostsData}
                  category="value"
                  index="name"
                  colors={["indigo", "cyan", "gray"]}
                  showAnimation={true}
                />
              ) : (
                <div className="flex items-center justify-center h-32 w-32 rounded-full border-4 border-gray-100 text-gray-300">
                  <Server className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Producción</span></div>
                <span className="text-xs text-gray-500">{prodHosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Desarrollo</span></div>
                <span className="text-xs text-gray-500">{devHosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Otros</span></div>
                <span className="text-xs text-gray-500">{otherHosts}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Incidentes Recientes */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Incidentes Recientes (Webhooks)</h2>
          <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
            {data?.incidents && data.incidents.length > 0 ? (
              data.incidents.map((incident: any, idx: number) => {
                const isCrit = incident.severity === 'CRITICAL';
                const isWarn = incident.severity === 'WARNING';
                const isInfo = incident.severity === 'INFO';
                const isResolved = incident.status === 'RESUELTA';
                
                let variant = "default";
                if (isResolved) variant = "success";
                else if (isCrit) variant = "danger";
                else if (isWarn) variant = "warning";
                else if (isInfo) variant = "info";

                return (
                  <div key={idx} className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-start flex-1 min-w-0 pr-2">
                      <Badge variant={variant as any} className="mr-3 shrink-0">{isResolved ? 'RESUELTO' : incident.severity}</Badge>
                      <div className="truncate">
                        <div className="text-sm font-bold text-vepagos-navy truncate" title={incident.summary}>{incident.summary}</div>
                        <div className="text-xs text-gray-400">{incident.incident_type}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-400 whitespace-nowrap">
                      {new Date(incident.triggered_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 text-sm py-4">
                No hay incidentes recientes registrados.
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 md:left-[280px] right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-6 z-10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1 text-vepagos-green" />
          <span>Última act: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center">
          {error ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-500">Desconectado</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-vepagos-green rounded-full mr-2 animate-pulse"></div>
              <span>Datos en tiempo real</span>
            </>
          )}
        </div>
        <div>
          <span>Fuentes: Prometheus | DB Webhooks</span>
        </div>
      </div>
    </div>
  );
}
