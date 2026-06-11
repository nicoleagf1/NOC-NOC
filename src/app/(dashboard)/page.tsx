"use client";

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
  Clock
} from "lucide-react";

const lineChartData = [
  { date: "09 May", "Disponibilidad": 100 },
  { date: "10 May", "Disponibilidad": 100 },
  { date: "11 May", "Disponibilidad": 100 },
  { date: "12 May", "Disponibilidad": 99.5 },
  { date: "13 May", "Disponibilidad": 99.8 },
  { date: "14 May", "Disponibilidad": 99.9 },
  { date: "15 May", "Disponibilidad": 99.9 },
];

const donutServicesData = [
  { name: "Activos", value: 124, color: "emerald-500" },
  { name: "Caídos", value: 2, color: "red-500" },
];

const donutAlertsData = [
  { name: "Críticas", value: 3, color: "red-500" },
  { name: "Advertencias", value: 9, color: "amber-500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-20 relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vista general del estado operativo de la plataforma Vepagos
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Clock className="w-4 h-4 mr-2 text-vepagos-navy" />
          <span>09:42:15 AM</span>
          <span className="mx-2">|</span>
          <span>15 MAY 2024</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Servicios Activos</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-vepagos-green" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-green">124</div>
              <div className="text-[10px] text-vepagos-green bg-vepagos-green/10 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold">↑ 98.4%</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">Del Total</div>
        </Card>

        {/* Card 2 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Servicios Caídos</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-500">2</div>
              <div className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold">↑ 1.6%</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">Del Total</div>
        </Card>

        {/* Card 3 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Alertas Activas</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <BellRing className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-500">12</div>
            </div>
          </div>
          <div className="text-[10px] font-bold mt-3 text-right">
            <span className="text-red-500">CRÍTICAS: 3</span> <span className="text-gray-300 mx-1">|</span> <span className="text-amber-500">ADVERT: 9</span>
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
              <div className="text-3xl font-bold text-vepagos-green">99.72%</div>
              <div className="text-[10px] text-vepagos-green bg-vepagos-green/10 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold">↑ 0.18%</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase">VS Ayer</div>
        </Card>

        {/* Card 5 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-vepagos-navy uppercase tracking-wider mb-3 text-center">Hosts Monitoreados</div>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Server className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-vepagos-navy">87</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 text-right uppercase mt-auto pt-4">Todos Los Sistemas</div>
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
              <div className="absolute inset-0 rounded-full border-8 border-vepagos-green/20"></div>
              <div className="absolute inset-2 rounded-full border-8 border-vepagos-green/40"></div>
              <div className="absolute inset-4 rounded-full border-8 border-vepagos-green flex items-center justify-center bg-white">
                <ShieldCheck className="w-12 h-12 text-vepagos-green" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-vepagos-green mb-2 uppercase">Operación Saludable</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Todos los sistemas críticos se encuentran operando correctamente.
            </p>
            
            <div className="flex space-x-2 w-full">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Tiempo Activo</div>
                <div className="text-sm font-bold text-vepagos-navy">15d 6h 42m</div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">MTTR Promedio</div>
                <div className="text-sm font-bold text-vepagos-navy">18m 24s</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Disponibilidad Line Chart */}
        <Card className="p-6 col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Disponibilidad Global (Últimos 7 Días)</h2>
            <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none">
              <option>7 DÍAS</option>
            </select>
          </div>
          <div className="flex-1 h-[250px]">
            <LineChart
              className="h-full mt-4"
              data={lineChartData}
              index="date"
              categories={["Disponibilidad"]}
              colors={["emerald"]}
              valueFormatter={(number) => `${number}%`}
              yAxisWidth={40}
              showLegend={false}
              minValue={98}
              maxValue={100}
            />
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
                colors={["emerald", "red"]}
                showAnimation={true}
              />
            </div>
            <div className="w-1/2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-vepagos-green mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Activos</span></div>
                <span className="text-xs text-gray-500">124 (98.4%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Degradados</span></div>
                <span className="text-xs text-gray-500">0 (0.0%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Caídos</span></div>
                <span className="text-xs text-gray-500">2 (1.6%)</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep uppercase tracking-wide">
              VER TODOS LOS SERVICIOS →
            </button>
          </div>
        </Card>

        {/* Alertas Donut */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Alertas por Nivel de Severidad</h2>
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
                <span className="text-xs text-gray-500">3 (25%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Advertencias</span></div>
                <span className="text-xs text-gray-500">9 (75%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div><span className="text-xs font-bold text-vepagos-navy uppercase">Informativas</span></div>
                <span className="text-xs text-gray-500">0 (0%)</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep uppercase tracking-wide">
              VER TODAS LAS ALERTAS →
            </button>
          </div>
        </Card>

        {/* Incidentes Recientes */}
        <Card className="p-6">
          <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider mb-6">Incidentes Recientes</h2>
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-gray-50 pb-3">
              <div className="flex items-start">
                <Badge variant="danger" className="mr-3">CRÍTICO</Badge>
                <div>
                  <div className="text-sm font-bold text-vepagos-navy">API de Pagos no responde</div>
                  <div className="text-xs text-gray-400">srv-api-pagos-01</div>
                </div>
              </div>
              <div className="text-xs font-bold text-red-500">09:21 AM</div>
            </div>
            <div className="flex items-start justify-between border-b border-gray-50 pb-3">
              <div className="flex items-start">
                <Badge variant="warning" className="mr-3">ADVERTENCIA</Badge>
                <div>
                  <div className="text-sm font-bold text-vepagos-navy">Alta utilización de CPU</div>
                  <div className="text-xs text-gray-400">srv-app-03</div>
                </div>
              </div>
              <div className="text-xs font-bold text-amber-500">08:57 AM</div>
            </div>
            <div className="flex items-start justify-between border-b border-gray-50 pb-3">
              <div className="flex items-start">
                <Badge variant="info" className="mr-3">INFORMATIVO</Badge>
                <div>
                  <div className="text-sm font-bold text-vepagos-navy">Backup nocturno completado</div>
                  <div className="text-xs text-gray-400">srv-backup-01</div>
                </div>
              </div>
              <div className="text-xs font-bold text-blue-500">07:12 AM</div>
            </div>
            <div className="flex items-start justify-between pb-1">
              <div className="flex items-start">
                <Badge variant="success" className="mr-3">RESUELTO</Badge>
                <div>
                  <div className="text-sm font-bold text-vepagos-navy">Latencia elevada en BD</div>
                  <div className="text-xs text-gray-400">srv-db-02</div>
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400">Ayer, 11:43 PM</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep uppercase tracking-wide">
              VER HISTORIAL DE INCIDENTES →
            </button>
          </div>
        </Card>

      </div>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-[280px] right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-6 z-10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1 text-vepagos-green" />
          <span>Última actualización: 09:42:15 AM</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-vepagos-green rounded-full mr-2 animate-pulse"></div>
          <span>Datos en tiempo real</span>
        </div>
        <div>
          <span>Fuentes: Prometheus | Uptime Kuma</span>
        </div>
      </div>
    </div>
  );
}
