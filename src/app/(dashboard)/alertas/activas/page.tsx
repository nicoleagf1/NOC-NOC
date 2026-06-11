"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  BellRing,
  XCircle,
  Info,
  CheckCircle2,
  Settings,
  Check,
  Search,
  Filter,
  ChevronDown,
  Eye,
  MoreVertical,
  ArrowDown
} from "lucide-react";

// Mock data for alerts table
const alertsList = [
  { id: 1, sev: "CRÍTICO", sevVar: "danger", date: "15 MAY 2024", time: "09:42:15 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-API-PAGOS-01", hostSub: "API DE PAGOS", desc: "Uso de CPU mayor al 90%", descSub: "Actual: 94% | Umbral: 90%", status: "ACTIVA", duration: "00:21:43" },
  { id: 2, sev: "CRÍTICO", sevVar: "danger", date: "15 MAY 2024", time: "09:32:08 AM", source: "UPTIME KUMA", sourceCol: "text-green-600 bg-green-50", host: "GATEWAY DE PAGOS", hostSub: "https://gateway.vepagos.com", desc: "Servicio no disponible (Down)", descSub: "Tiempo fuera: 2m 14s", status: "ACTIVA", duration: "00:31:50" },
  { id: 3, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "09:28:41 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-DB-02", hostSub: "BASE DE DATOS", desc: "Uso de memoria mayor al 75%", descSub: "Actual: 77% | Umbral: 75%", status: "ACTIVA", duration: "00:35:17" },
  { id: 4, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "09:15:22 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-FILES-01", hostSub: "ARCHIVOS", desc: "Latencia de disco elevada", descSub: "Actual: 18.6 ms | Umbral: 15 ms", status: "ACTIVA", duration: "00:48:36" },
  { id: 5, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "09:05:11 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-WEB-02", hostSub: "WEB APP", desc: "Errores 5xx superiores al 1%", descSub: "Actual: 2.35% | Umbral: 1%", status: "ACTIVA", duration: "00:58:47" },
  { id: 6, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "08:58:33 AM", source: "UPTIME KUMA", sourceCol: "text-green-600 bg-green-50", host: "PORTAL TRANSACCIONAL", hostSub: "https://portal.vepagos.com", desc: "Tiempo de respuesta elevado", descSub: "Actual: 2.45 s | Umbral: 2.0 s", status: "ACTIVA", duration: "01:05:24" },
  { id: 7, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "08:45:09 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-MAIL-01", hostSub: "SERVICIO DE CORREOS", desc: "Uso de almacenamiento mayor al 80%", descSub: "Actual: 82% | Umbral: 80%", status: "ACTIVA", duration: "01:18:36" },
  { id: 8, sev: "ADVERTENCIA", sevVar: "warning", date: "15 MAY 2024", time: "08:30:02 AM", source: "PROMETHEUS", sourceCol: "text-blue-600 bg-blue-50", host: "SRV-APP-03", hostSub: "APLICACIÓN", desc: "Conexiones activas elevadas", descSub: "Actual: 420 | Umbral: 400", status: "ACTIVA", duration: "01:33:43" },
];

export default function AlertasActivasPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Centro de Alertas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y gestiona todas las alertas activas en la plataforma.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="font-bold uppercase tracking-wider text-xs h-[38px] px-4 rounded-[var(--radius-pill)]">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Reglas
          </Button>
          <Button variant="primary" className="font-bold uppercase tracking-wider text-xs h-[38px] px-4 rounded-[var(--radius-pill)]">
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Alertas Activas */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Alertas Activas</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">12</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-center mt-2">
            <span className="text-red-500">CRÍTICAS: 3</span> <span className="text-gray-300 mx-1">|</span> <span className="text-amber-500">ADVERT: 9</span>
          </div>
        </Card>

        {/* Advertencias */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Advertencias</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 leading-none">9</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">75.0% Del Total</div>
        </Card>

        {/* Criticas */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Críticas</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">3</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">25.0% Del Total</div>
        </Card>

        {/* Informativas */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Informativas</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 leading-none">0</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">0.0% Del Total</div>
        </Card>

        {/* Resueltas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Resueltas Hoy</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">8</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">Últimas 24 Horas</div>
        </Card>
      </div>

      {/* Alerts Table Section */}
      <div className="bg-white rounded-[var(--radius-card)] border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por host, servicio, métrica o descripción..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green focus:border-vepagos-green transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Severidad</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">TODAS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Estado</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">ACTIVAS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -mt-2 ml-2 bg-white px-1">Fuente</label>
              <div className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs">
                <span className="font-bold text-vepagos-navy">TODAS</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            
            <button className="flex items-center text-gray-500 hover:text-vepagos-navy text-xs font-bold transition-colors ml-2 mt-1">
              <Filter className="w-3 h-3 mr-1" />
              FILTROS
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Severidad</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest flex items-center">
                  Fecha / Hora <ArrowDown className="w-3 h-3 ml-1" />
                </th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Fuente</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Host / Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Estado</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Duración</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alertsList.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3">
                    <Badge variant={alert.sevVar as any}>{alert.sev}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-vepagos-navy uppercase">{alert.date}</div>
                    <div className="text-[10px] text-gray-400">{alert.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${alert.sourceCol}`}>{alert.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-vepagos-navy uppercase">{alert.host}</div>
                    <div className="text-[10px] text-gray-400 truncate w-40">{alert.hostSub}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-vepagos-navy">{alert.desc}</div>
                    <div className="text-[10px] text-gray-500">{alert.descSub}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-red-500 uppercase">{alert.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-vepagos-navy">{alert.duration}</span>
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
          <div>Mostrando 1 a 8 de 12 Alertas Activas</div>
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
