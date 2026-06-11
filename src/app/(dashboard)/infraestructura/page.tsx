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

// Mock data for charts
const sparkCpu = [ { v: 25 }, { v: 24 }, { v: 22 }, { v: 26 }, { v: 23 }, { v: 21 }, { v: 23.4 } ];
const sparkMem = [ { v: 54 }, { v: 55 }, { v: 56 }, { v: 55 }, { v: 57 }, { v: 58 }, { v: 58.7 } ];
const sparkDisk = [ { v: 59 }, { v: 60 }, { v: 60 }, { v: 59 }, { v: 61 }, { v: 61 }, { v: 61.2 } ];

const timeSeriesData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  "CPU": 20 + Math.random() * 10,
  "Memoria": 50 + Math.random() * 15,
  "Disco": 60 + Math.random() * 5,
  "Entrada": 100 + Math.random() * 50,
  "Salida": 50 + Math.random() * 30,
  "Lectura": 800 + Math.random() * 400,
  "Escritura": 500 + Math.random() * 300,
  "Latencia": 15 + Math.random() * 10,
}));

// Mock data for Top 5 Hosts
const topHosts = [
  { host: "SRV-APP-01", ip: "10.10.1.21", cpu: 72, mem: 81, disk: 78, traf: "156 Mbps", status: "ADVERTENCIA", statusColor: "warning" },
  { host: "SRV-DB-01", ip: "10.10.1.15", cpu: 48, mem: 64, disk: 55, traf: "98 Mbps", status: "OK", statusColor: "success" },
  { host: "SRV-WEB-02", ip: "10.10.1.22", cpu: 36, mem: 43, disk: 38, traf: "67 Mbps", status: "OK", statusColor: "success" },
  { host: "SRV-FILES-01", ip: "10.10.1.18", cpu: 28, mem: 35, disk: 62, traf: "74 Mbps", status: "ADVERTENCIA", statusColor: "warning" },
  { host: "SRV-MAIL-01", ip: "10.10.1.19", cpu: 18, mem: 27, disk: 31, traf: "41 Mbps", status: "OK", statusColor: "success" },
];

const alerts = [
  { sev: "CRÍTICA", sevColor: "danger", host: "SRV-APP-01", ip: "10.10.1.21", metric: "USO DE CPU", desc: "Uso de CPU mayor al 90% por más de 5 minutos", val: "94%", date: "15/05/2024 09:37 AM", dur: "00:05:42" },
  { sev: "ADVERTENCIA", sevColor: "warning", host: "SRV-FILES-01", ip: "10.10.1.18", metric: "USO DE DISCO", desc: "Uso de disco mayor al 80%", val: "82%", date: "15/05/2024 09:21 AM", dur: "00:21:07" },
  { sev: "ADVERTENCIA", sevColor: "warning", host: "SRV-DB-02", ip: "10.10.1.16", metric: "MEMORIA", desc: "Uso de memoria mayor al 75%", val: "77%", date: "15/05/2024 09:10 AM", dur: "00:32:18" },
];

export default function InfraestructuraPage() {
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
            <div className="flex items-center justify-between border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-40 cursor-pointer">
              <span className="text-xs font-bold text-vepagos-navy">TODOS LOS HOSTS</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
            <div className="flex items-center justify-between border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-48 cursor-pointer">
              <span className="text-xs font-bold text-vepagos-navy">ÚLTIMAS <span className="font-normal text-gray-500">24 HORAS</span></span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <button className="flex items-center border border-vepagos-green text-vepagos-green hover:bg-vepagos-green/5 px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors">
            <Download className="w-3 h-3 mr-2" />
            EXPORTAR
          </button>
        </div>
      </div>

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
              <div className="text-3xl font-bold text-vepagos-navy leading-none">87</div>
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
              <div className="text-3xl font-bold text-vepagos-green leading-none">23.4%</div>
              <div className="text-[10px] font-bold text-vepagos-green mt-1">-2.6% VS AYER</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkCpu} categories={["v"]} index="v" colors={["emerald"]} className="h-full w-full" />
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
              <div className="text-3xl font-bold text-amber-500 leading-none">58.7%</div>
              <div className="text-[10px] font-bold text-amber-500 mt-1">+4.3% VS AYER</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkMem} categories={["v"]} index="v" colors={["amber"]} className="h-full w-full" />
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
              <div className="text-3xl font-bold text-amber-500 leading-none">61.2%</div>
              <div className="text-[10px] font-bold text-amber-500 mt-1">+1.8% VS AYER</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkDisk} categories={["v"]} index="v" colors={["amber"]} className="h-full w-full" />
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
              <div className="text-3xl font-bold text-red-500 leading-none">8</div>
            </div>
          </div>
          <div className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest mt-2">3 CRÍTICAS</div>
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
            <div className="text-xl font-bold text-vepagos-navy">23.4%</div>
          </div>
          <AreaChart data={timeSeriesData} index="time" categories={["CPU"]} colors={["emerald"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
        </Card>

        {/* Memoria Chart */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Uso de Memoria</h3>
              <div className="text-[10px] text-gray-400">%</div>
            </div>
            <div className="text-xl font-bold text-vepagos-navy">58.7%</div>
          </div>
          <AreaChart data={timeSeriesData} index="time" categories={["Memoria"]} colors={["blue"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
        </Card>

        {/* Disco Chart */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Uso de Disco</h3>
              <div className="text-[10px] text-gray-400">%</div>
            </div>
            <div className="text-xl font-bold text-vepagos-navy">61.2%</div>
          </div>
          <AreaChart data={timeSeriesData} index="time" categories={["Disco"]} colors={["purple"]} className="h-32 mt-2" showLegend={false} showYAxis={true} showGridLines={false} valueFormatter={(v) => `${Math.round(v)}%`} />
        </Card>

        {/* Red Chart */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Tráfico de Red</h3>
              <div className="text-[10px] text-gray-400">Mbps</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-vepagos-green">125 <span className="text-[10px] font-normal">Mbps</span></div>
              <div className="text-sm font-bold text-blue-500">98 <span className="text-[10px] font-normal">Mbps</span></div>
            </div>
          </div>
          <AreaChart data={timeSeriesData} index="time" categories={["Entrada", "Salida"]} colors={["emerald", "blue"]} className="h-32 mt-2" showLegend={true} showYAxis={true} showGridLines={false} />
        </Card>

        {/* IOPS Chart */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">IOPS de Disco</h3>
              <div className="text-[10px] text-gray-400">Ops/s</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-vepagos-green">1.245</div>
              <div className="text-lg font-bold text-blue-500">876</div>
            </div>
          </div>
          <LineChart data={timeSeriesData} index="time" categories={["Lectura", "Escritura"]} colors={["emerald", "blue"]} className="h-40 mt-2" showLegend={true} showYAxis={true} showGridLines={true} />
        </Card>

        {/* Latencia Chart */}
        <Card className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-[11px] font-bold text-vepagos-navy uppercase tracking-widest">Latencia Promedio</h3>
              <div className="text-[10px] text-gray-400">ms</div>
            </div>
            <div className="text-xl font-bold text-vepagos-navy">18.6 ms</div>
          </div>
          <LineChart data={timeSeriesData} index="time" categories={["Latencia"]} colors={["emerald"]} className="h-40 mt-2" showLegend={false} showYAxis={true} showGridLines={true} valueFormatter={(v) => `${Math.round(v)}`} />
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
                {topHosts.map((host, i) => (
                  <tr key={i}>
                    <td className="py-2">
                      <div className="font-bold text-vepagos-navy">{host.host}</div>
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
              {alerts.map((alert, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2"><Badge variant={alert.sevColor as any}>{alert.sev}</Badge></td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-vepagos-navy">{alert.host}</div>
                    <div className="text-[10px] text-gray-400">{alert.ip}</div>
                  </td>
                  <td className="py-3 px-2 font-bold text-vepagos-navy">{alert.metric}</td>
                  <td className="py-3 px-2 text-gray-500">{alert.desc}</td>
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

    </div>
  );
}
