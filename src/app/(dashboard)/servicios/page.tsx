"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparkAreaChart, Tracker } from "@tremor/react";
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Wrench,
  RotateCw,
  Search,
  Filter,
  Activity,
  MoreVertical,
  Globe,
  Database,
  Settings,
  CreditCard,
  Mail,
  Cloud,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";

// Mock data for sparklines
const sparkData1 = [ { v: 90 }, { v: 92 }, { v: 91 }, { v: 95 }, { v: 94 }, { v: 96 }, { v: 98 } ];
const sparkData2 = [ { v: 10 }, { v: 12 }, { v: 8 }, { v: 6 }, { v: 7 }, { v: 5 }, { v: 4 } ];
const sparkData3 = [ { v: 2 }, { v: 3 }, { v: 2 }, { v: 4 }, { v: 5 }, { v: 3 }, { v: 2 } ];
const sparkData4 = [ { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 } ];

// Tracker mock data (24h availability)
const trackerSuccess = Array.from({ length: 24 }).map(() => ({ color: "emerald", tooltip: "Disponible" }));
const trackerWarning = Array.from({ length: 24 }).map((_, i) => ({ color: i > 15 && i < 20 ? "amber" : "emerald", tooltip: "Degradado" }));
const trackerDanger = Array.from({ length: 24 }).map((_, i) => ({ color: i > 5 ? "red" : "emerald", tooltip: "Caído" }));

// Mock data for table
const servicesList = [
  { id: 1, name: "API DE PAGOS", url: "https://api.vepagos.com", status: "DISPONIBLE", type: "HTTPS", group: "PRODUCCIÓN", disp: "100.00%", response: "182 ms", lastEvent: "HACE 1 MIN", icon: Globe, statusColor: "vepagos-green", badgeVar: "success", tracker: trackerSuccess },
  { id: 2, name: "PORTAL TRANSACCIONAL", url: "https://portal.vepagos.com", status: "DISPONIBLE", type: "HTTPS", group: "PRODUCCIÓN", disp: "99.98%", response: "245 ms", lastEvent: "HACE 2 MIN", icon: Globe, statusColor: "vepagos-green", badgeVar: "success", tracker: trackerSuccess },
  { id: 3, name: "BASE DE DATOS PRINCIPAL", url: "mysql://db-principal", status: "DISPONIBLE", type: "TCP", group: "BASES DE DATOS", disp: "99.95%", response: "12 ms", lastEvent: "HACE 1 MIN", icon: Database, statusColor: "vepagos-green", badgeVar: "success", tracker: trackerSuccess },
  { id: 4, name: "SERVICIO DE REPORTES", url: "https://reportes.vepagos.com", status: "DEGRADADO", type: "HTTPS", group: "PRODUCCIÓN", disp: "98.67%", response: "1.24 s", lastEvent: "HACE 5 MIN", icon: Settings, statusColor: "amber-500", badgeVar: "warning", tracker: trackerWarning },
  { id: 5, name: "GATEWAY DE PAGOS", url: "https://gateway.vepagos.com", status: "CAÍDO", type: "HTTPS", group: "PRODUCCIÓN", disp: "0.00%", response: "N/D", lastEvent: "HACE 3 MIN", icon: CreditCard, statusColor: "red-500", badgeVar: "danger", tracker: trackerDanger },
  { id: 6, name: "SERVICIO DE CORREOS", url: "smtp.vepagos.com", status: "DISPONIBLE", type: "SMTP", group: "SERVICIOS", disp: "100.00%", response: "210 ms", lastEvent: "HACE 1 MIN", icon: Mail, statusColor: "vepagos-green", badgeVar: "success", tracker: trackerSuccess },
  { id: 7, name: "BACKUP NOCTURNO", url: "backup.vepagos.com", status: "DEGRADADO", type: "FTP", group: "INFRAESTRUCTURA", disp: "95.12%", response: "2.45 s", lastEvent: "HACE 8 MIN", icon: Cloud, statusColor: "amber-500", badgeVar: "warning", tracker: trackerWarning },
  { id: 8, name: "MÓDULO DE FACTURACIÓN", url: "https://facturacion.vepagos.com", status: "MANTENIMIENTO", type: "HTTPS", group: "DESARROLLO", disp: "0.00%", response: "N/D", lastEvent: "HACE 15 MIN", icon: Wrench, statusColor: "gray-400", badgeVar: "default", tracker: Array.from({ length: 24 }).map(() => ({ color: "gray", tooltip: "Mantenimiento" })) },
];

export default function ServiciosPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Monitoreo de Servicios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Estado y disponibilidad de todos los servicios monitoreados por Uptime Kuma.
          </p>
        </div>
        
        <div className="flex items-end space-x-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grupo</label>
            <div className="flex items-center justify-between border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-32 cursor-pointer">
              <span className="text-xs font-bold text-vepagos-navy">TODOS</span>
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
            <RotateCw className="w-3 h-3 mr-2" />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Servicios Totales</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-navy leading-none">126</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Todos los servicios</div>
        </Card>

        {/* Disponibles */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Disponibles</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">118</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">93.65%</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkData1} categories={["v"]} index="v" colors={["emerald"]} className="h-full w-full" />
          </div>
        </Card>

        {/* Degradados */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-amber-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Degradados</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 leading-none">6</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">4.76%</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkData2} categories={["v"]} index="v" colors={["amber"]} className="h-full w-full" />
          </div>
        </Card>

        {/* Caidos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Caídos</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">2</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">1.59%</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkData3} categories={["v"]} index="v" colors={["red"]} className="h-full w-full" />
          </div>
        </Card>

        {/* Mantenimiento */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-gray-400">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Mantenimiento</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 leading-none">0</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">0.00%</div>
            </div>
          </div>
          <div className="h-6">
            <SparkAreaChart data={sparkData4} categories={["v"]} index="v" colors={["slate"]} className="h-full w-full" />
          </div>
        </Card>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[var(--radius-card)] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar servicio, descripción o etiqueta..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green focus:border-vepagos-green transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Estado</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-28 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">TODOS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Tipo</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-28 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">TODOS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Etiqueta</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">TODAS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            
            <button className="flex items-center text-gray-500 hover:text-vepagos-navy text-xs font-bold transition-colors ml-2 mt-1">
              <Filter className="w-3 h-3 mr-1" />
              LIMPIAR FILTROS
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest w-1/4">Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Estado</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Tipo</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Grupo</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center">Disponibilidad<br/><span className="text-[8px] text-gray-400">24H</span></th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center">Tiempo de Respuesta<br/><span className="text-[8px] text-gray-400">PROMEDIO (24H)</span></th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Último Evento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {servicesList.map((service) => {
                const Icon = service.icon;
                return (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 bg-${service.statusColor}`}></div>
                        <Icon className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <div className="text-xs font-bold text-vepagos-navy uppercase">{service.name}</div>
                          <div className="text-[10px] text-gray-400">{service.url}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={service.badgeVar as any}>{service.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">{service.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-vepagos-navy uppercase">{service.group}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-xs font-bold ${service.statusColor.includes('green') ? 'text-vepagos-green' : (service.statusColor.includes('amber') ? 'text-amber-500' : (service.statusColor.includes('red') ? 'text-red-500' : 'text-gray-400'))}`}>{service.disp}</span>
                        <div className="w-16 h-3">
                          <Tracker data={service.tracker as any} className="h-full w-full mt-0" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-vepagos-navy">{service.response}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-vepagos-green">{service.lastEvent}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy">
                          <Activity className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
          <div>Mostrando 1 a 8 de 126 Servicios</div>
          <div className="flex items-center space-x-2">
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-7 h-7 flex items-center justify-center border border-vepagos-green bg-vepagos-green/10 text-vepagos-green rounded">1</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded">2</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded">3</button>
            <span className="px-1">...</span>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded">16</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Filas por página</span>
            <div className="flex items-center justify-between border border-gray-200 rounded px-2 py-1 w-14 cursor-pointer">
              <span className="font-bold text-vepagos-navy">10</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
