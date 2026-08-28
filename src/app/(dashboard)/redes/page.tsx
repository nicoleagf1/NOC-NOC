"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, SparkAreaChart } from "@tremor/react";
import { 
  Network, 
  Cpu, 
  MemoryStick,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  Activity,
  ArrowDownUp
} from "lucide-react";

import { useState, useEffect } from "react";
import { Loader2, RotateCw } from "lucide-react";

export default function RedesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("24h");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics/network?periodo=${periodo}`);
      if (!res.ok) throw new Error("Failed to fetch network data");
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
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Redes y Conectividad
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoreo del tráfico de red, enlaces WAN y estado de firewalls (Fortigate).
          </p>
        </div>
        
        <div className="flex items-end space-x-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
            <div className="relative">
              <select
                value={periodo}
                onChange={(e) => { setPeriodo(e.target.value); setTimeout(fetchData, 50); }}
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
            onClick={fetchData}
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
            
            {/* Estado del Fortigate */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Estado del Firewall</div>
              <div className="flex items-center justify-center space-x-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.kpis.isUp ? 'bg-vepagos-green/10' : 'bg-red-100'}`}>
                  <ShieldCheck className={`w-5 h-5 ${data.kpis.isUp ? 'text-vepagos-green' : 'text-red-500'}`} />
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold leading-none ${data.kpis.isUp ? 'text-vepagos-green' : 'text-red-500'}`}>
                    {data.kpis.isUp ? 'UP' : 'DOWN'}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Fortigate Principal</div>
            </Card>

            {/* CPU Fortigate */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">CPU Firewall</div>
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-vepagos-green" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-green leading-none">{data.kpis.cpu}%</div>
                </div>
              </div>
              <div className="h-6 mt-1 flex justify-center">
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-vepagos-green h-1.5 rounded-full" style={{ width: `${data.kpis.cpu}%` }}></div>
                </div>
              </div>
            </Card>

            {/* RAM Fortigate */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Memoria Firewall</div>
              <div className="flex items-center justify-center space-x-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
                  <MemoryStick className="w-5 h-5 text-vepagos-green" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-green leading-none">{data.kpis.memory}%</div>
                </div>
              </div>
              <div className="h-6 mt-1 flex justify-center">
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-vepagos-green h-1.5 rounded-full" style={{ width: `${data.kpis.memory}%` }}></div>
                </div>
              </div>
            </Card>

            {/* Sesiones y Tráfico */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Sesiones Activas</div>
              <div className="flex items-center justify-center space-x-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-navy leading-none">
                    {data.kpis.sessions}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Conexiones concurrentes</div>
            </Card>

            {/* Interfaces Activas */}
            <Card className="p-4 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Interfaces Activas</div>
              <div className="flex items-center justify-center space-x-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Network className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vepagos-navy leading-none">
                    {data.kpis.activeInterfacesCount}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">Puertos UP</div>
            </Card>
          </div>

          {/* Gráficas de Tráfico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-[11px] font-bold text-vepagos-navy mb-4 uppercase tracking-widest font-barlow-condensed flex items-center">
                <ArrowDownUp className="w-4 h-4 mr-2 text-vepagos-green" /> 
                Tráfico Digitel (wan2)
              </h3>
              <div className="h-72">
                <AreaChart
                  data={data.timeSeriesData}
                  index="date"
                  categories={["Digitel Descarga (Rx)", "Digitel Subida (Tx)"]}
                  colors={["emerald", "indigo"]}
                  valueFormatter={(number) => `${number.toFixed(2)} Mbps`}
                  showLegend={true}
                  className="h-full mt-4"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-[11px] font-bold text-vepagos-navy mb-4 uppercase tracking-widest font-barlow-condensed flex items-center">
                <ArrowDownUp className="w-4 h-4 mr-2 text-vepagos-green" /> 
                Tráfico Netuno (wan1)
              </h3>
              <div className="h-72">
                <AreaChart
                  data={data.timeSeriesData}
                  index="date"
                  categories={["Netuno Descarga (Rx)", "Netuno Subida (Tx)"]}
                  colors={["emerald", "indigo"]}
                  valueFormatter={(number) => `${number.toFixed(2)} Mbps`}
                  showLegend={true}
                  className="h-full mt-4"
                />
              </div>
            </Card>
          </div>

        </>
      ) : null}
    </div>
  );
}
