"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Settings2, 
  Bell, 
  Users, 
  ShieldCheck, 
  FileText,
  Activity,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  MoreVertical,
  Link2,
  ChevronDown
} from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
          Configuración
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra las integraciones, reglas de alerta, notificaciones y ajustes generales del sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-vepagos-green text-vepagos-green uppercase tracking-wide whitespace-nowrap">
          Integraciones
        </button>
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300 uppercase tracking-wide whitespace-nowrap">
          Reglas de Alerta
        </button>
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300 uppercase tracking-wide whitespace-nowrap">
          Notificaciones
        </button>
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300 uppercase tracking-wide whitespace-nowrap">
          Usuarios
        </button>
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300 uppercase tracking-wide whitespace-nowrap">
          Sistema
        </button>
        <button className="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300 uppercase tracking-wide whitespace-nowrap">
          Auditoría
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prometheus Card */}
            <Card className="p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-vepagos-green"></div>
                </label>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Activity className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vepagos-navy uppercase">Prometheus</h3>
                  <div className="flex items-center text-xs text-vepagos-green font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    CONECTADO
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-auto">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL de Endpoint</div>
                  <div className="text-xs text-vepagos-navy flex items-center justify-between border border-gray-100 bg-gray-50 rounded px-2 py-1 mt-1">
                    <span className="truncate">http://prometheus.internal:9090</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-2" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Última sincronización</span>
                  <span className="font-bold text-vepagos-navy">Hace 1 min</span>
                </div>
                <Button variant="outline" className="w-full h-8 text-xs font-bold uppercase" size="sm">Configurar</Button>
              </div>
            </Card>

            {/* Uptime Kuma Card */}
            <Card className="p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-vepagos-green"></div>
                </label>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vepagos-navy uppercase">Uptime Kuma</h3>
                  <div className="flex items-center text-xs text-vepagos-green font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    CONECTADO
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-auto">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL de Endpoint</div>
                  <div className="text-xs text-vepagos-navy flex items-center justify-between border border-gray-100 bg-gray-50 rounded px-2 py-1 mt-1">
                    <span className="truncate">http://kuma.internal:3001</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-2" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Última sincronización</span>
                  <span className="font-bold text-vepagos-navy">Hace 2 min</span>
                </div>
                <Button variant="outline" className="w-full h-8 text-xs font-bold uppercase" size="sm">Configurar</Button>
              </div>
            </Card>

            {/* Add Integration Card */}
            <div className="border-2 border-dashed border-gray-300 rounded-[var(--radius-card)] p-5 flex flex-col items-center justify-center cursor-pointer hover:border-vepagos-green hover:bg-vepagos-green/5 transition-colors group min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-vepagos-green/10 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-vepagos-green" />
              </div>
              <div className="text-sm font-bold text-gray-500 group-hover:text-vepagos-navy uppercase tracking-wide">Añadir Nueva Integración</div>
            </div>
          </div>

          {/* Reglas de Alerta Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Reglas de Alerta Recientes</h3>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-vepagos-green h-6 px-2">Ver Todas →</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Métrica</th>
                    <th className="px-4 py-3">Umbral</th>
                    <th className="px-4 py-3">Severidad</th>
                    <th className="px-4 py-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { name: "CPU High Usage", metric: "node_cpu_seconds", threshold: "> 90% por 5m", sev: "CRÍTICO", sevVar: "danger", active: true },
                    { name: "Memory High", metric: "node_memory_MemAv", threshold: "< 10% por 5m", sev: "CRÍTICO", sevVar: "danger", active: true },
                    { name: "Disk Space Warning", metric: "node_filesystem", threshold: "> 85% usado", sev: "ADVERTENCIA", sevVar: "warning", active: true },
                    { name: "High Latency API", metric: "http_request_dur", threshold: "> 2s por 1m", sev: "ADVERTENCIA", sevVar: "warning", active: false },
                  ].map((rule, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-vepagos-navy">{rule.name}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-500">{rule.metric}</td>
                      <td className="px-4 py-3 text-vepagos-navy">{rule.threshold}</td>
                      <td className="px-4 py-3"><Badge variant={rule.sevVar as any} className="text-[9px] px-1.5 py-0">{rule.sev}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={rule.active} />
                          <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-vepagos-green"></div>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Usuarios */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Usuarios Recientes</h3>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="p-4 space-y-4">
              {[
                { init: "AD", name: "Administrador", role: "Super Admin", color: "bg-vepagos-green" },
                { init: "OP", name: "Operador NOC 1", role: "Viewer", color: "bg-blue-200" },
                { init: "EN", name: "Ing. Infraestructura", role: "Editor", color: "bg-purple-200" },
              ].map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-vepagos-navy mr-3 ${u.color}`}>{u.init}</div>
                    <div>
                      <div className="text-xs font-bold text-vepagos-navy">{u.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{u.role}</div>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2 h-8 text-[10px] uppercase tracking-widest font-bold">Gestionar Usuarios</Button>
            </div>
          </Card>

          {/* Sistema */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Configuración del Sistema</h3>
              <Settings2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-xs font-bold text-vepagos-navy">Canales de Notificación</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
              </div>
              <div className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-xs font-bold text-vepagos-navy">Políticas de Retención</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
              </div>
              <div className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Link2 className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-xs font-bold text-vepagos-navy">Webhooks Globales</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
