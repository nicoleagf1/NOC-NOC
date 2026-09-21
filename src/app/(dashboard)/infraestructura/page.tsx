"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, LineChart, SparkAreaChart } from "@tremor/react";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  AlertTriangle,
  Download,
  ChevronDown,
  Eye,
  Copy,
  Check,
  XCircle,
  X,
  Info,
  ExternalLink,
  FlaskConical,
  ShieldAlert
} from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Loader2, RotateCw } from "lucide-react";

export default function InfraestructuraPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupo, setGrupo] = useState("TODOS");
  const [periodo, setPeriodo] = useState("24h");

  // Estados para acciones y modal de alertas
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);
  const [simulatedAlert, setSimulatedAlert] = useState<any | null>(null);
  const [highlightedHost, setHighlightedHost] = useState<string | null>(null);

  const fetchData = async (g: string, p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics/infrastructure?grupo=${g}&periodo=${p}`);
      if (!res.ok) throw new Error("Failed to fetch infrastructure data");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
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
    fetchData(grupo, periodo);
    const interval = setInterval(() => fetchData(grupo, periodo), 60000);
    return () => clearInterval(interval);
  }, [grupo, periodo]);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Manejo de acciones en Alertas
  const handleCopyAlert = (alert: any) => {
    const report = `[ALERTA NOC DE INFRAESTRUCTURA - ${alert.sev}]
Estado: ${alert.status}
Host: ${alert.host} (${alert.ip})
Sistema Operativo: ${alert.osType || 'Linux/Windows'}
Métrica / Regla: ${alert.metric}
Valor Actual: ${alert.val}
Descripción: ${alert.desc}
Hora de Disparo: ${alert.date}
Duración: ${alert.dur}
Fuente: Prometheus (NOC-NOC)`;

    navigator.clipboard.writeText(report);
    setCopiedAlertId(alert.id);
    setTimeout(() => setCopiedAlertId(null), 2000);
  };

  const handleResolveSingle = async (id: string) => {
    setResolvingId(id);
    if (id === "sim-high-cpu-1") {
      setSimulatedAlert((prev: any) => prev ? { ...prev, status: 'RESUELTA', dur: 'Resuelta' } : null);
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev: any) => prev ? { ...prev, status: 'RESUELTA', dur: 'Resuelta' } : prev);
      }
      setResolvingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/metrics/alerts/${id}/resolve`, { method: 'PUT' });
      if (res.ok) {
        setData((prev: any) => {
          if (!prev || !prev.alerts) return prev;
          return {
            ...prev,
            alerts: prev.alerts.map((a: any) =>
              a.id === id ? { ...a, status: 'RESUELTA', dur: 'Resuelta' } : a
            )
          };
        });
        if (selectedAlert?.id === id) {
          setSelectedAlert((prev: any) => prev ? { ...prev, status: 'RESUELTA', dur: 'Resuelta' } : prev);
        }
      }
    } catch (e) {
      console.error('Error al resolver alerta:', e);
    } finally {
      setResolvingId(null);
    }
  };

  const handleViewDetails = (alert: any) => {
    setSelectedAlert(alert);
  };

  const handleFocusHost = (hostName: string) => {
    setHighlightedHost(hostName);
    const elem = document.getElementById("top-hosts-card");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedHost(null), 4000);
  };

  const handleToggleSimulation = () => {
    if (simulatedAlert) {
      setSimulatedAlert(null);
    } else {
      const sampleHost = data?.topHosts?.[0] || { host: "srv-prod-db01", ip: "192.168.10.45", osType: "Linux" };
      setSimulatedAlert({
        id: "sim-high-cpu-1",
        isSimulated: true,
        status: "ACTIVA",
        sev: "CRÍTICA",
        sevColor: "danger",
        host: sampleHost.host,
        ip: sampleHost.ip,
        osType: sampleHost.osType || "Linux",
        metric: "HIGH_CPU_USAGE",
        desc: "El uso de CPU supera el 92% de forma sostenida (umbral crítico). Riesgo inminente de degradación del servicio.",
        summary: "Saturación sostenida de CPU en nodo productivo",
        val: "94.8%",
        date: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        dur: "8m 42s",
        labels: {
          alertname: "HighCPUUsage",
          severity: "critical",
          instance: `${sampleHost.ip}:9100`,
          job: "node_exporter",
          environment: "produccion",
          node: sampleHost.host
        },
        annotations: {
          summary: "Uso de CPU excepcionalmente alto en el host",
          description: "El uso de CPU supera el 92% durante más de 3 minutos",
          runbook_url: "https://wiki.vepagos.com/ops/high-cpu"
        }
      });
    }
  };

  const displayAlerts = useMemo(() => {
    return [
      ...(simulatedAlert ? [simulatedAlert] : []),
      ...(data?.alerts || [])
    ];
  }, [data?.alerts, simulatedAlert]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Infraestructura
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoreo de recursos y rendimiento de hosts e instancias.
          </p>
        </div>

        <div className="flex items-end space-x-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grupo</label>
            <div className="relative">
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="appearance-none border border-gray-200 bg-white rounded-[var(--radius-input)] pl-3 pr-8 py-2 w-40 cursor-pointer text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
              >
                <option value="TODOS">TODOS LOS HOSTS</option>
                <option value="LINUX">LINUX SERVERS</option>
                <option value="WINDOWS">WINDOWS SERVERS</option>
                <option value="DATABASE">DATABASES</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
            <div className="relative">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="appearance-none border border-gray-200 bg-white rounded-[var(--radius-input)] pl-3 pr-8 py-2 w-48 cursor-pointer text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
              >
                <option value="1h">ÚLTIMA HORA</option>
                <option value="6h">ÚLTIMAS 6 HORAS</option>
                <option value="24h">ÚLTIMAS 24 HORAS</option>
                <option value="7d">ÚLTIMOS 7 DÍAS</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={() => fetchData(grupo, periodo)}
            className="flex items-center border border-vepagos-green text-vepagos-green hover:bg-vepagos-green/5 px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors"
          >
            <RotateCw className={`w-3 h-3 mr-2 ${loading && data ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-100 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-vepagos-green animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Hosts Totales */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Hosts Totales</div>
              <div className="flex items-center justify-center space-x-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Server className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-navy leading-none">{data.globalKpis.totalHosts}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">{data.grupoLabel || (grupo === 'WINDOWS' ? 'Servidores Windows' : grupo === 'LINUX' ? 'Servidores Linux' : grupo === 'DATABASE' ? 'Bases de Datos' : 'Todos los sistemas')}</div>
            </Card>

            {/* CPU */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">CPU Promedio</div>
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-vepagos-green" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-green leading-none">{data.globalKpis.cpuAvg}%</div>
                </div>
              </div>
              <div className="h-6">
                <SparkAreaChart data={data.sparkCpu} categories={["v"]} index="v" colors={["emerald"]} className="h-full w-full" />
              </div>
            </Card>

            {/* Memoria */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Memoria Promedio</div>
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <MemoryStick className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500 leading-none">{data.globalKpis.memAvg}%</div>
                </div>
              </div>
              <div className="h-6">
                <SparkAreaChart data={data.sparkMem} categories={["v"]} index="v" colors={["amber"]} className="h-full w-full" />
              </div>
            </Card>

            {/* Disco */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Disco Promedio</div>
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500 leading-none">{data.globalKpis.diskAvg}%</div>
                </div>
              </div>
              <div className="h-6">
                <SparkAreaChart data={data.sparkDisk} categories={["v"]} index="v" colors={["amber"]} className="h-full w-full" />
              </div>
            </Card>

            {/* Alertas */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Alertas de Infra.</div>
              <div className="flex items-center justify-center space-x-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 leading-none">{data.globalKpis.activeAlerts}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* CPU Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Uso de CPU</h3>
                  <div className="text-[10px] text-gray-400">%</div>
                </div>
                <div className="text-xl font-bold text-vepagos-navy">{data.globalKpis.cpuAvg}%</div>
              </div>
              <AreaChart data={data.timeSeriesData} index="time" categories={["CPU"]} colors={["emerald"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
            </Card>

            {/* Memoria Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Uso de Memoria</h3>
                  <div className="text-[10px] text-gray-400">%</div>
                </div>
                <div className="text-xl font-bold text-vepagos-navy">{data.globalKpis.memAvg}%</div>
              </div>
              <AreaChart data={data.timeSeriesData} index="time" categories={["Memoria"]} colors={["blue"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
            </Card>

            {/* Disco Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Uso de Disco</h3>
                  <div className="text-[10px] text-gray-400">%</div>
                </div>
                <div className="text-xl font-bold text-vepagos-navy">{data.globalKpis.diskAvg}%</div>
              </div>
              <AreaChart data={data.timeSeriesData} index="time" categories={["Disco"]} colors={["purple"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
            </Card>

            {/* Red Chart */}
            <Card className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Tráfico de Red</h3>
                  <div className="text-[10px] text-gray-400">Mbps</div>
                </div>
              </div>
              <AreaChart data={data.timeSeriesData} index="time" categories={["Entrada", "Salida"]} colors={["emerald", "blue"]} className="h-32 mt-2" showLegend={true} showYAxis={true} showGridLines={false} />
            </Card>

            {/* IOPS Chart */}
            <Card className="p-4 lg:col-span-2">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">IOPS de Disco</h3>
                  <div className="text-[10px] text-gray-400">Ops/s</div>
                </div>
              </div>
              <LineChart data={data.timeSeriesData} index="time" categories={["Lectura", "Escritura"]} colors={["emerald", "blue"]} className="h-40 mt-2" showLegend={true} showYAxis={true} showGridLines={true} />
            </Card>

            {/* Top 5 Hosts Table */}
            <Card id="top-hosts-card" className="p-4 lg:col-span-1 overflow-hidden flex flex-col scroll-mt-24 transition-all">
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest mb-4">Top 5 Hosts por uso de recursos</h3>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-100 uppercase tracking-widest text-gray-400">
                      <th className="pb-2">Host</th>
                      <th className="pb-2 text-center">CPU</th>
                      <th className="pb-2 text-center">Memoria</th>
                      <th className="pb-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.topHosts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          No hay servidores activos en el grupo seleccionado ({grupo === 'WINDOWS' ? 'Windows' : grupo === 'LINUX' ? 'Linux' : grupo === 'DATABASE' ? 'Bases de Datos' : grupo})
                        </td>
                      </tr>
                    ) : data.topHosts.map((host: any, i: number) => (
                      <tr
                        key={i}
                        className={`transition-colors duration-300 ${highlightedHost === host.host ? 'bg-emerald-50 ring-1 ring-vepagos-green' : 'hover:bg-gray-50/50'
                          }`}
                      >
                        <td className="py-2">
                          <div className="font-bold text-vepagos-navy truncate w-24 md:w-32" title={host.host}>{host.host}</div>
                          <div className="text-gray-400 flex items-center space-x-1 text-[9px]">
                            <span>{host.ip}</span>
                            {host.osType && (
                              <span className={`px-1 rounded text-[8px] font-semibold ${host.osType.toLowerCase() === 'windows' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                {host.osType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center text-vepagos-navy font-bold">{host.cpu}%</td>
                        <td className="py-2 text-center text-vepagos-navy font-bold">{host.mem}%</td>
                        <td className="py-2 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${host.statusColor === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{host.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Alertas Recientes */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Alertas Recientes de Infraestructura</h3>
                {displayAlerts.length > 0 ? (
                  <Badge variant={displayAlerts.some((a: any) => a.sev === 'CRÍTICA') ? 'danger' : 'warning'}>
                    {displayAlerts.length} {displayAlerts.length === 1 ? 'Alerta' : 'Alertas'}
                  </Badge>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    0 Activas
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleSimulation}
                  className={`flex items-center text-[10px] font-bold px-2.5 py-1.5 rounded transition-all cursor-pointer ${simulatedAlert
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'bg-gray-100 text-vepagos-navy border border-gray-200 hover:bg-gray-200'
                    }`}
                  title="Simula una alerta activa para validar y probar las acciones del NOC en caliente"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-vepagos-navy" />
                  {simulatedAlert ? 'Quitar Alerta de Prueba' : 'Simular Alerta de Prueba'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 uppercase tracking-widest text-gray-400 text-[10px]">
                    <th className="pb-3 px-2">Severidad</th>
                    <th className="pb-3 px-2">Estado</th>
                    <th className="pb-3 px-2">Host</th>
                    <th className="pb-3 px-2">Métrica</th>
                    <th className="pb-3 px-2">Descripción</th>
                    <th className="pb-3 px-2 text-center">Valor Actual</th>
                    <th className="pb-3 px-2">Inicio</th>
                    <th className="pb-3 px-2">Duración</th>
                    <th className="pb-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Check className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-semibold text-vepagos-navy">No hay alertas ni incidentes recientes</p>
                          <p className="text-[11px] text-gray-400 max-w-sm">
                            No se registran alertas activas en Prometheus ni incidentes recientes en la base de datos para este grupo.
                          </p>
                          <button
                            onClick={handleToggleSimulation}
                            className="mt-2 inline-flex items-center text-[11px] font-bold text-vepagos-navy hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            Simular alerta de prueba para validar acciones
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : displayAlerts.map((alert: any, i: number) => (
                    <tr key={alert.id || i} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          <Badge variant={alert.sevColor as any}>{alert.sev}</Badge>
                          {alert.isSimulated && (
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-tighter">
                              TEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${alert.status === 'ACTIVA'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleFocusHost(alert.host)}
                          className="font-bold text-vepagos-navy truncate w-32 text-left hover:text-vepagos-green transition-colors cursor-pointer"
                          title={`Host: ${alert.host} (Clic para enfocar)`}
                        >
                          {alert.host}
                        </button>
                        <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                          <span>{alert.ip}</span>
                          {alert.osType && (
                            <span className={`px-1 rounded text-[8px] font-semibold ${alert.osType.toLowerCase() === 'windows' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                              {alert.osType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold text-vepagos-navy truncate max-w-xs">{alert.metric}</td>
                      <td className="py-3 px-2 text-gray-500 max-w-sm truncate" title={alert.desc}>{alert.desc}</td>
                      <td className="py-3 px-2 text-center font-bold text-red-500">{alert.val}</td>
                      <td className="py-3 px-2 text-gray-500">{alert.date}</td>
                      <td className="py-3 px-2 text-gray-500">{alert.dur}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleCopyAlert(alert)}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy transition-colors cursor-pointer"
                            title="Copiar Reporte NOC"
                          >
                            {copiedAlertId === alert.id ? <Check className="w-4 h-4 text-vepagos-green" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleViewDetails(alert)}
                            className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Ver Detalle Técnico"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFocusHost(alert.host)}
                            className="p-1.5 hover:bg-emerald-50 rounded text-gray-400 hover:text-vepagos-green transition-colors cursor-pointer"
                            title="Enfocar Host en Recursos"
                          >
                            <Server className="w-4 h-4" />
                          </button>
                          {alert.status === 'ACTIVA' && (
                            <button
                              onClick={() => handleResolveSingle(alert.id)}
                              disabled={resolvingId === alert.id}
                              className="p-1.5 hover:bg-emerald-100 rounded text-gray-400 hover:text-emerald-700 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Marcar como Resuelta"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/alertas/activas?source=PROMETHEUS')}
                className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep uppercase tracking-wide cursor-pointer transition-colors"
              >
                VER TODAS LAS ALERTAS DE INFRAESTRUCTURA →
              </button>
            </div>
          </Card>

          {/* Modal de Detalle Técnico de Alerta */}
          {selectedAlert && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vepagos-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <Card className="w-full max-w-xl bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAlert.sevColor === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                      {selectedAlert.sevColor === 'danger' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                          Detalle Técnico de la Alerta
                        </h2>
                        {selectedAlert.isSimulated && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            SIMULADA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {selectedAlert.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="text-gray-400 hover:text-gray-600 bg-white p-1.5 rounded-md border border-gray-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* Badges / Estado */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado</label>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded inline-block ${selectedAlert.status === 'ACTIVA' ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                        {selectedAlert.status === 'ACTIVA' ? 'ACTIVA (FIRING)' : 'RESUELTA'}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Severidad</label>
                      <Badge variant={selectedAlert.sevColor as any}>{selectedAlert.sev}</Badge>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Registrado</label>
                      <span className="text-sm font-bold text-red-500">{selectedAlert.val}</span>
                    </div>
                  </div>

                  {/* Host / Instancia */}
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Host Afectado</label>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-sm font-bold text-vepagos-navy">{selectedAlert.host}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedAlert.ip}</div>
                      </div>
                      {selectedAlert.osType && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedAlert.osType.toLowerCase() === 'windows' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                          {selectedAlert.osType} Server
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Métrica y Descripción */}
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Regla y Descripción</label>
                    <div className="text-sm font-bold text-vepagos-navy mb-1.5">{selectedAlert.metric}</div>
                    <div className="text-xs text-gray-700 bg-white p-2.5 rounded border border-gray-200">
                      {selectedAlert.desc}
                    </div>
                  </div>

                  {/* Tiempos */}
                  <div className={`grid ${selectedAlert.resolvedAt ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inicio de Alerta</label>
                      <div className="text-xs font-semibold text-vepagos-navy">{selectedAlert.date}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {selectedAlert.status === 'RESUELTA' ? 'Duración Total' : 'Duración Activa'}
                      </label>
                      <div className="text-xs font-bold text-amber-700 font-mono">{selectedAlert.dur}</div>
                    </div>
                    {selectedAlert.resolvedAt && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hora Resolución</label>
                        <div className="text-xs font-semibold text-emerald-700">{selectedAlert.resolvedAt}</div>
                      </div>
                    )}
                  </div>

                  {/* Etiquetas / Labels de Prometheus */}
                  {selectedAlert.labels && Object.keys(selectedAlert.labels).length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Etiquetas de Prometheus (Labels)
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                        {Object.entries(selectedAlert.labels).map(([key, val]: [string, any]) => (
                          <span key={key} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-600">
                            <strong className="text-vepagos-navy">{key}:</strong> {String(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl">
                  <Button variant="outline" size="sm" onClick={() => setSelectedAlert(null)}>
                    Cerrar
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-xs font-bold"
                      onClick={() => handleCopyAlert(selectedAlert)}
                    >
                      {copiedAlertId === selectedAlert.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-vepagos-green" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                          Copiar Reporte
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] text-xs font-bold"
                      onClick={() => {
                        const hostName = selectedAlert.host;
                        setSelectedAlert(null);
                        handleFocusHost(hostName);
                      }}
                    >
                      <Server className="w-3.5 h-3.5 mr-1.5" />
                      Enfocar Host
                    </Button>
                    {selectedAlert.status === 'ACTIVA' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold"
                        onClick={() => handleResolveSingle(selectedAlert.id)}
                        disabled={resolvingId === selectedAlert.id}
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        {resolvingId === selectedAlert.id ? 'Resolviendo...' : 'Marcar como Resuelta'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>,
            document.body
          )}
        </>
      ) : null}
    </div>
  );
}
