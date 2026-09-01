"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, LineChart, SparkAreaChart } from "@tremor/react";
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  AlertTriangle,
  Download,
  ChevronDown,
  Eye
} from "lucide-react";

import { useState, useEffect } from "react";
import { Loader2, RotateCw } from "lucide-react";

export default function InfraestructuraPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grupo, setGrupo] = useState("TODOS");
  const [periodo, setPeriodo] = useState("24h");

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
          <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Todos los sistemas</div>
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
        <Card className="p-4 lg:col-span-1 overflow-hidden flex flex-col">
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
                {data.topHosts.map((host: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2">
                      <div className="font-bold text-vepagos-navy truncate w-24 md:w-32" title={host.host}>{host.host}</div>
                      <div className="text-gray-400">{host.ip}</div>
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
        <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest mb-4">Alertas Recientes de Infraestructura</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 uppercase tracking-widest text-gray-400 text-[10px]">
                <th className="pb-3 px-2">Severidad</th>
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
              {data.alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">No hay alertas activas en Prometheus</td>
                </tr>
              ) : data.alerts.map((alert: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2"><Badge variant={alert.sevColor as any}>{alert.sev}</Badge></td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-vepagos-navy truncate w-32" title={alert.host}>{alert.host}</div>
                    <div className="text-[10px] text-gray-400">{alert.ip}</div>
                  </td>
                  <td className="py-3 px-2 font-bold text-vepagos-navy truncate max-w-xs">{alert.metric}</td>
                  <td className="py-3 px-2 text-gray-500 max-w-sm truncate" title={alert.desc}>{alert.desc}</td>
                  <td className="py-3 px-2 text-center font-bold text-red-500">{alert.val}</td>
                  <td className="py-3 px-2 text-gray-500">{alert.date}</td>
                  <td className="py-3 px-2 text-gray-500">{alert.dur}</td>
                  <td className="py-3 px-2 text-right">
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <button className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep uppercase tracking-wide">
            VER TODAS LAS ALERTAS DE INFRAESTRUCTURA →
          </button>
        </div>
      </Card>
      </>
      ) : null}
    </div>
  );
}
