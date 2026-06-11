"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  BellRing,
  XCircle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  Eye,
  MoreVertical,
  ArrowDown,
  ListTodo,
  Calendar
} from "lucide-react";

const eventosList = [
  { id: 1, date: "15 MAY 2024", time: "09:42:15 AM", type: "ALERTA", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-API-PAGOS-01", desc: "Uso de CPU mayor al 90%", sev: "CRÍTICO", sevVar: "danger" },
  { id: 2, date: "15 MAY 2024", time: "09:32:08 AM", type: "CAÍDA", source: "UPTIME KUMA", sourceCol: "text-green-600 bg-green-50", host: "GATEWAY DE PAGOS", desc: "Servicio no disponible (Down)", sev: "CRÍTICO", sevVar: "danger" },
  { id: 3, date: "15 MAY 2024", time: "09:28:41 AM", type: "RESOLUCIÓN", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-DB-02", desc: "Uso de memoria normalizado", sev: "RESUELTO", sevVar: "success" },
  { id: 4, date: "15 MAY 2024", time: "09:15:22 AM", type: "ALERTA", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-FILES-01", desc: "Latencia de disco elevada", sev: "ADVERTENCIA", sevVar: "warning" },
  { id: 5, date: "15 MAY 2024", time: "09:05:11 AM", type: "MANTENIMIENTO", source: "SISTEMA", sourceCol: "text-purple-600 bg-purple-50", host: "MÓDULO DE FACTURACIÓN", desc: "Inicio de ventana de mantenimiento", sev: "INFORMATIVO", sevVar: "info" },
  { id: 6, date: "15 MAY 2024", time: "08:58:33 AM", type: "ALERTA", source: "UPTIME KUMA", sourceCol: "text-green-600 bg-green-50", host: "PORTAL TRANSACCIONAL", desc: "Tiempo de respuesta elevado", sev: "ADVERTENCIA", sevVar: "warning" },
  { id: 7, date: "15 MAY 2024", time: "08:45:09 AM", type: "RESOLUCIÓN", source: "SISTEMA", sourceCol: "text-purple-600 bg-purple-50", host: "SRV-MAIL-01", desc: "Reinicio automático completado", sev: "RESUELTO", sevVar: "success" },
  { id: 8, date: "15 MAY 2024", time: "08:30:02 AM", type: "ALERTA", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-APP-03", desc: "Conexiones activas elevadas", sev: "ADVERTENCIA", sevVar: "warning" },
];

export default function EventosPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Histórico de Eventos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro detallado de todas las alertas, incidentes y resoluciones del sistema.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 flex-wrap gap-y-2 justify-end max-w-2xl">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar evento..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green transition-all"
            />
          </div>
          
          <div className="flex items-center border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs">
            <span className="font-bold text-gray-500 mr-2 uppercase text-[10px]">Tipo:</span>
            <span className="font-bold text-vepagos-navy flex-1">TODOS</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>
          
          <div className="flex items-center border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs">
            <span className="font-bold text-gray-500 mr-2 uppercase text-[10px]">Fuente:</span>
            <span className="font-bold text-vepagos-navy flex-1">TODAS</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          <div className="flex items-center border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs">
            <span className="font-bold text-gray-500 mr-2 uppercase text-[10px]">Sev:</span>
            <span className="font-bold text-vepagos-navy flex-1">TODAS</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          <div className="flex items-center border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-40 cursor-pointer text-xs">
            <Calendar className="w-3 h-3 text-gray-400 mr-2" />
            <span className="font-bold text-vepagos-navy flex-1 text-[10px]">ÚLT. 30 DÍAS</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          <button className="flex items-center border border-vepagos-navy text-vepagos-navy hover:bg-vepagos-navy hover:text-white px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors uppercase">
            <Filter className="w-3 h-3 mr-2" />
            Filtrar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Eventos Totales */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Eventos Totales</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-navy leading-none">1,245</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">Últimos 30 días</div>
        </Card>

        {/* Criticas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Críticos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">42</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">3.37% Del Total</div>
        </Card>

        {/* Advertencias */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-amber-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Advertencias</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 leading-none">156</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">12.53% Del Total</div>
        </Card>

        {/* Informativos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-blue-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Informativos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 leading-none">890</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">71.48% Del Total</div>
        </Card>

        {/* Resueltos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Resueltos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">157</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">12.61% Del Total</div>
        </Card>
      </div>

      {/* Events Table Section */}
      <div className="bg-white rounded-[var(--radius-card)] border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest flex items-center">
                  Fecha / Hora <ArrowDown className="w-3 h-3 ml-1" />
                </th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Tipo</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Fuente</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Host / Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Severidad</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {eventosList.map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="text-xs font-bold text-vepagos-navy uppercase">{evt.date}</div>
                    <div className="text-[10px] text-gray-400">{evt.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold text-gray-500">{evt.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${evt.sourceCol}`}>{evt.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-vepagos-navy uppercase">{evt.host}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{evt.desc}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={evt.sevVar as any}>{evt.sev}</Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy border border-gray-200">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy border border-gray-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
          <div>Mostrando 1 a 8 de 1,245 Eventos</div>
          <div className="flex items-center space-x-2">
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <button className="w-7 h-7 flex items-center justify-center border border-vepagos-green bg-vepagos-green/10 text-vepagos-green rounded">1</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded">2</button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-gray-400"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
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
