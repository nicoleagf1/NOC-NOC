"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart } from "@tremor/react";
import { 
  Network, 
  Cpu, 
  MemoryStick,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  Activity,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  Check,
  X,
  Loader2,
  RotateCw,
  Gauge,
  Info
} from "lucide-react";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function RedesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("24h");

  // Estados para modal de configuración de umbrales
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const [thresholdsForm, setThresholdsForm] = useState({
    netuno: {
      minMbps: 15,
      maxCapacityMbps: 100,
      saturationThresholdPercent: 90
    },
    digitel: {
      minMbps: 10,
      maxCapacityMbps: 50,
      saturationThresholdPercent: 90
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metrics/network?periodo=${periodo}`);
      if (!res.ok) throw new Error("Failed to fetch network data");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
        // Sincronizar estado del formulario con los umbrales actuales guardados
        if (json.data?.thresholdsConfig?.providers) {
          const prov = json.data.thresholdsConfig.providers;
          setThresholdsForm({
            netuno: {
              minMbps: prov.netuno?.minMbps ?? 15,
              maxCapacityMbps: prov.netuno?.maxCapacityMbps ?? 100,
              saturationThresholdPercent: prov.netuno?.saturationThresholdPercent ?? 90
            },
            digitel: {
              minMbps: prov.digitel?.minMbps ?? 10,
              maxCapacityMbps: prov.digitel?.maxCapacityMbps ?? 50,
              saturationThresholdPercent: prov.digitel?.saturationThresholdPercent ?? 90
            }
          });
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
    const interval = setInterval(fetchData, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingThresholds(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await fetch("/api/settings/network-thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providers: {
            netuno: {
              name: "Netuno (wan1)",
              interface: "wan1",
              minMbps: Number(thresholdsForm.netuno.minMbps),
              maxCapacityMbps: Number(thresholdsForm.netuno.maxCapacityMbps),
              saturationThresholdPercent: Number(thresholdsForm.netuno.saturationThresholdPercent)
            },
            digitel: {
              name: "Digitel (wan2)",
              interface: "wan2",
              minMbps: Number(thresholdsForm.digitel.minMbps),
              maxCapacityMbps: Number(thresholdsForm.digitel.maxCapacityMbps),
              saturationThresholdPercent: Number(thresholdsForm.digitel.saturationThresholdPercent)
            }
          }
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudieron guardar los umbrales.");
      }

      setSaveSuccessMsg("Umbrales de red actualizados correctamente.");
      await fetchData();
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setSaveSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setSaveErrorMsg(err.message || "Error al actualizar configuración");
    } finally {
      setIsSavingThresholds(false);
    }
  };

  const handleResetDefaults = () => {
    setThresholdsForm({
      netuno: {
        minMbps: 15,
        maxCapacityMbps: 100,
        saturationThresholdPercent: 90
      },
      digitel: {
        minMbps: 10,
        maxCapacityMbps: 50,
        saturationThresholdPercent: 90
      }
    });
  };

  // Helper para renderizar tarjetas de estado WAN
  const renderWanCard = (wan: any, defaultName: string, roleLabel: string) => {
    if (!wan) return null;

    const isStable = wan.status === "ESTABLE";
    const isDegraded = wan.status === "INESTABLE_DEGRADADO";
    const isSaturated = wan.status === "INESTABLE_SATURADO";
    const isDown = wan.status === "CAIDO";

    let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    let badgeLabel = "Conexión Estable";
    let statusDotColor = "bg-emerald-500";

    if (isDown) {
      badgeClass = "bg-red-100 text-red-800 border-red-300";
      badgeLabel = "Enlace Desconectado";
      statusDotColor = "bg-red-600";
    } else if (isSaturated) {
      badgeClass = "bg-red-50 text-red-700 border-red-200";
      badgeLabel = "Enlace Saturado";
      statusDotColor = "bg-red-500";
    } else if (isDegraded) {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      badgeLabel = "Conexión Inestable";
      statusDotColor = "bg-amber-500 animate-ping";
    }

    // Color barra de progreso
    let progressBarColor = "bg-vepagos-green";
    if (isSaturated || wan.usagePercent >= 90) {
      progressBarColor = "bg-red-500";
    } else if (wan.usagePercent >= 70) {
      progressBarColor = "bg-amber-500";
    }

    return (
      <Card className="p-5 flex flex-col justify-between border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Barra superior con gradiente de estado */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 ${
            isStable ? 'bg-vepagos-green' : isDegraded ? 'bg-amber-500' : 'bg-red-500'
          }`} 
        />

        <div>
          {/* Header del Enlace */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold font-barlow-condensed text-lg text-vepagos-navy uppercase tracking-wide">
                  {wan.name || defaultName}
                </span>
                <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {wan.interface}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{roleLabel}</p>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${statusDotColor}`} />
                {badgeLabel}
              </span>
            </div>
          </div>

          {/* Alerta contextual en caso de inestabilidad */}
          {wan.alertMessage && (
            <div className={`mb-4 p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
              isSaturated 
                ? 'bg-red-50/80 border-red-200 text-red-800' 
                : isDegraded 
                ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                : 'bg-red-100 border-red-300 text-red-900'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
              <div>
                <span className="font-bold">Aviso del Sistema: </span>
                <span>{wan.alertMessage}</span>
              </div>
            </div>
          )}

          {/* Métricas de Velocidad Actual (Rx / Tx) */}
          <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
            <div>
              <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                <ArrowDown className="w-3 h-3 mr-1 text-vepagos-green" />
                Descarga (Rx)
              </div>
              <div className="text-2xl font-bold font-barlow-condensed text-vepagos-navy">
                {wan.rxMbps} <span className="text-xs font-normal text-gray-500 font-sans">Mbps</span>
              </div>
            </div>

            <div>
              <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                <ArrowUp className="w-3 h-3 mr-1 text-indigo-500" />
                Subida (Tx)
              </div>
              <div className="text-2xl font-bold font-barlow-condensed text-vepagos-navy">
                {wan.txMbps} <span className="text-xs font-normal text-gray-500 font-sans">Mbps</span>
              </div>
            </div>
          </div>

          {/* Barra de Consumo / Saturación */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Uso de Capacidad:</span>
              <span className="font-bold text-vepagos-navy">
                {wan.usagePercent}% <span className="text-gray-400 font-normal">de {wan.thresholds?.maxCapacityMbps || 100} Mbps</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${progressBarColor}`}
                style={{ width: `${Math.min(wan.usagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer con Umbrales Configurados */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Umbral Mínimo:</span>
            <span className="font-bold text-vepagos-navy">{wan.thresholds?.minMbps} Mbps</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Saturación:</span>
            <span className="font-bold text-vepagos-navy">
              ≥ {wan.thresholds?.saturationMbps} Mbps ({wan.thresholds?.saturationThresholdPercent}%)
            </span>
          </div>
        </div>
      </Card>
    );
  };

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
        
        <div className="flex flex-wrap items-end gap-3">
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
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center bg-vepagos-navy hover:bg-vepagos-navy/90 text-white px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-vepagos-green" />
            CONFIGURAR UMBRALES
          </button>

          <button 
            onClick={fetchData}
            className="flex items-center border border-vepagos-green text-vepagos-green hover:bg-vepagos-green/5 px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3 h-3 mr-2 ${loading && data ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-100 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Banner de Avisos Activos de Inestabilidad / Saturación */}
      {data?.networkAlerts && data.networkAlerts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 uppercase font-barlow-condensed tracking-wide">
                  Aviso Activo de Red ({data.networkAlerts.length})
                </h4>
                <div className="mt-1 space-y-1">
                  {data.networkAlerts.map((alert: any) => (
                    <p key={alert.id} className="text-xs text-amber-800 flex flex-wrap items-center gap-1.5">
                      <span className="font-bold underline">{alert.providerName}:</span>
                      <span>{alert.message}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="self-start sm:self-center shrink-0 text-xs font-bold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100/60 transition-colors shadow-xs cursor-pointer"
            >
              Ajustar Umbrales
            </button>
          </div>
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

          {/* Sección Estado de Enlaces WAN y Calidad de Conexión */}
          {data?.wanData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-vepagos-green" />
                    Estado de Enlaces WAN y Navegación
                  </h2>
                  <p className="text-xs text-gray-500">
                    Evaluación en tiempo real del caudal de descarga y subida contra umbrales mínimos y saturación de ancho de banda.
                  </p>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-xs text-vepagos-green hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Ajustar Umbrales
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderWanCard(data.wanData.netuno, "Netuno (wan1)", "Enlace Principal de Fibra")}
                {renderWanCard(data.wanData.digitel, "Digitel (wan2)", "Enlace Secundario / Respaldo")}
              </div>
            </div>
          )}

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

      {/* Modal de Configuración de Umbrales */}
      {isConfigModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vepagos-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl rounded-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center text-vepagos-green">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                    Configurar Umbrales de Red y Navegación
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define la cantidad de megas mínimos y el límite de saturación para cada proveedor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white p-1.5 rounded-md border border-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveThresholds} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Nota informativa */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">¿Cómo funcionan estos avisos?</span>
                    <p className="mt-0.5 text-blue-800">
                      • <strong>Conexión Inestable:</strong> Se genera aviso cuando la descarga (Rx) cae por debajo de los <em>Megas Mínimos</em> configurados.<br />
                      • <strong>Saturación:</strong> Se genera aviso cuando el tráfico alcanza o supera el <em>% de Saturación</em> respecto a la capacidad contratada.
                    </p>
                  </div>
                </div>

                {saveErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bloque Netuno */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-vepagos-green" />
                        <span className="font-bold font-barlow-condensed text-vepagos-navy uppercase">
                          Netuno (wan1)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-vepagos-green/10 text-vepagos-green px-2 py-0.5 rounded-full">
                        Enlace Principal
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Capacidad Contratada (Mbps)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={thresholdsForm.netuno.maxCapacityMbps}
                        onChange={(e) => setThresholdsForm({
                          ...thresholdsForm,
                          netuno: { ...thresholdsForm.netuno, maxCapacityMbps: Number(e.target.value) }
                        })}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Ancho de banda contratado con el proveedor</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Umbral Mínimo de Alerta (Mbps)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={thresholdsForm.netuno.minMbps}
                        onChange={(e) => setThresholdsForm({
                          ...thresholdsForm,
                          netuno: { ...thresholdsForm.netuno, minMbps: Number(e.target.value) }
                        })}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Avisar si la descarga cae por debajo de este valor
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Umbral de Saturación (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="1"
                          min="10"
                          max="100"
                          value={thresholdsForm.netuno.saturationThresholdPercent}
                          onChange={(e) => setThresholdsForm({
                            ...thresholdsForm,
                            netuno: { ...thresholdsForm.netuno, saturationThresholdPercent: Number(e.target.value) }
                          })}
                          required
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                        />
                        <span className="text-sm font-bold text-gray-500">%</span>
                      </div>
                      <div className="text-[10px] font-bold text-vepagos-navy bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">
                        Dispara saturación a: <span className="text-vepagos-green font-bold">
                          {((Number(thresholdsForm.netuno.maxCapacityMbps) * Number(thresholdsForm.netuno.saturationThresholdPercent)) / 100).toFixed(1)} Mbps
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloque Digitel */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="font-bold font-barlow-condensed text-vepagos-navy uppercase">
                          Digitel (wan2)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        Enlace Respaldo
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Capacidad Contratada (Mbps)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={thresholdsForm.digitel.maxCapacityMbps}
                        onChange={(e) => setThresholdsForm({
                          ...thresholdsForm,
                          digitel: { ...thresholdsForm.digitel, maxCapacityMbps: Number(e.target.value) }
                        })}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Ancho de banda contratado con el proveedor</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Umbral Mínimo de Alerta (Mbps)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={thresholdsForm.digitel.minMbps}
                        onChange={(e) => setThresholdsForm({
                          ...thresholdsForm,
                          digitel: { ...thresholdsForm.digitel, minMbps: Number(e.target.value) }
                        })}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Avisar si la descarga cae por debajo de este valor
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Umbral de Saturación (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="1"
                          min="10"
                          max="100"
                          value={thresholdsForm.digitel.saturationThresholdPercent}
                          onChange={(e) => setThresholdsForm({
                            ...thresholdsForm,
                            digitel: { ...thresholdsForm.digitel, saturationThresholdPercent: Number(e.target.value) }
                          })}
                          required
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
                        />
                        <span className="text-sm font-bold text-gray-500">%</span>
                      </div>
                      <div className="text-[10px] font-bold text-vepagos-navy bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">
                        Dispara saturación a: <span className="text-indigo-600 font-bold">
                          {((Number(thresholdsForm.digitel.maxCapacityMbps) * Number(thresholdsForm.digitel.saturationThresholdPercent)) / 100).toFixed(1)} Mbps
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Restaurar Predeterminados
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingThresholds}
                    className="flex items-center bg-vepagos-navy hover:bg-vepagos-navy/90 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingThresholds ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-2 text-vepagos-green" />
                        Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}

