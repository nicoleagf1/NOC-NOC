"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparkAreaChart, Tracker, LineChart } from "@tremor/react";
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
  ChevronDown,
  Loader2,
  PauseCircle,
  History
} from "lucide-react";

export default function ServiciosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const selectedServiceForModal = selectedServiceId ? services.find(s => s.id === selectedServiceId) : null;
  const [pingingService, setPingingService] = useState<string | null>(null);
  const [togglingMaintenance, setTogglingMaintenance] = useState<string | null>(null);
  const [historyModalServiceId, setHistoryModalServiceId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [configModalService, setConfigModalService] = useState<any | null>(null);
  const [configInterval, setConfigInterval] = useState(60);
  const [configRetries, setConfigRetries] = useState(1);
  const [configSaving, setConfigSaving] = useState(false);

  // Close dropdown when clicking outside (simple approach: close on any scroll/click, or just manage it here)
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handlePing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingService(id);
    try {
      const res = await fetch(`/api/services/${id}/ping`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        console.log("Ping result:", json);
        // Refresh the list after a successful ping to potentially see updated status
        await fetchServices();
      } else {
        console.error("Ping failed:", await res.text());
      }
    } catch (err) {
      console.error("Error pinging service:", err);
    } finally {
      setPingingService(null);
    }
  };

  const handleToggleMaintenance = async (service: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingMaintenance(service.id);
    const newStatus = !service.isMaintenance;
    try {
      const res = await fetch(`/api/services/${service.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_maintenance: newStatus })
      });
      if (res.ok) {
        await fetchServices();
        setOpenDropdownId(null);
      } else {
        console.error("Failed to toggle maintenance:", await res.text());
      }
    } catch (err) {
      console.error("Error toggling maintenance:", err);
    } finally {
      setTogglingMaintenance(null);
    }
  };

  const openHistoryModal = async (serviceId: string) => {
    setOpenDropdownId(null);
    setHistoryModalServiceId(serviceId);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/incidents`);
      const json = await res.json();
      if (json.success) {
        setHistoryData(json.incidents);
      } else {
        console.error("Error fetching history:", json.error);
        setHistoryData([]);
      }
    } catch (e) {
      console.error(e);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openConfigModal = (service: any) => {
    setOpenDropdownId(null);
    setConfigModalService(service);
    setConfigInterval(60);
    setConfigRetries(1);
  };

  const saveConfig = async () => {
    if (!configModalService) return;
    setConfigSaving(true);
    try {
      const res = await fetch(`/api/services/${configModalService.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitor_interval: configInterval, maxretries: configRetries })
      });
      if (res.ok) {
        setConfigModalService(null);
      } else {
        console.error("Config save failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfigSaving(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/metrics/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const json = await res.json();
      if (json.success) {
        setServices(json.data || []);
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
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-vepagos-green" />
      </div>
    );
  }

  // Cálculos de KPIs basados en los datos reales
  const total = services.length;
  const up = services.filter(s => s.status === 'up').length;
  const down = services.filter(s => s.status === 'down').length;
  const degraded = services.filter(s => s.status === 'degraded').length;
  const maintenance = services.filter(s => s.status === 'maintenance').length; // Suponiendo soporte futuro

  const getPercent = (count: number) => total > 0 ? ((count / total) * 100).toFixed(2) : "0.00";

  // Filtrado
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
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
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
            <div className="flex items-center justify-between border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-48 cursor-pointer">
              <span className="text-xs font-bold text-vepagos-navy">EN VIVO</span>
            </div>
          </div>
          <button 
            onClick={fetchServices}
            className="flex items-center border border-vepagos-green text-vepagos-green hover:bg-vepagos-green/5 px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors"
          >
            <RotateCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
              <div className="text-3xl font-bold text-vepagos-navy leading-none">{total}</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-2">En Base de Datos</div>
        </Card>

        {/* Disponibles */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Disponibles</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">{up}</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">{getPercent(up)}%</div>
            </div>
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
              <div className="text-3xl font-bold text-amber-500 leading-none">{degraded}</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">{getPercent(degraded)}%</div>
            </div>
          </div>
        </Card>

        {/* Caídos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Caídos</div>
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">{down}</div>
              <div className="text-[10px] font-bold text-gray-500 mt-1">{getPercent(down)}%</div>
            </div>
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
              placeholder="Buscar servicio o identificador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green focus:border-vepagos-green transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest w-1/3">Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Estado</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center">Disponibilidad<br/><span className="text-[8px] text-gray-400">ACTUAL</span></th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center">Latencia</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    No hay servicios para mostrar o los filtros aplicados no tienen resultados.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service, idx) => {
                  const isMaintenance = service.isMaintenance;
                  const isUp = service.status === 'up' && !isMaintenance;
                  const statusColor = isMaintenance ? 'gray-400' : (isUp ? 'vepagos-green' : 'red-500');
                  const badgeVar = isMaintenance ? 'secondary' : (isUp ? 'success' : 'danger');
                  const dispStr = isMaintenance ? 'N/A' : (isUp ? '100.00%' : '0.00%');
                  const statusText = isMaintenance ? 'MANTENIMIENTO' : (isUp ? 'DISPONIBLE' : 'CAÍDO');
                  const Icon = Globe; // Default icon
                  
                  // Generar tracker mock basado en el estado
                  const trackerData = Array.from({ length: 15 }).map((_, i) => ({ 
                    color: isUp ? "emerald" : (i === 14 ? "red" : "emerald"), 
                    tooltip: isUp ? "Up" : (i === 14 ? "Down" : "Up") 
                  }));

                  return (
                    <tr key={`${service.id}-${idx}`} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 bg-${statusColor}`}></div>
                          <Icon className="w-4 h-4 text-gray-400 mr-3" />
                          <div>
                            <div className="text-xs font-bold text-vepagos-navy uppercase">{service.name}</div>
                            <div className="text-[10px] text-gray-400">{service.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVar as any}>{statusText}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-xs font-bold ${isUp ? 'text-vepagos-green' : 'text-red-500'}`}>{dispStr}</span>
                          <div className="w-16 h-3 hidden sm:block">
                            <Tracker data={trackerData as any} className="h-full w-full mt-0" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-vepagos-navy">{service.latencyMs || 'N/A'} ms</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1 relative">
                          <button 
                            title="Ver Telemetría"
                            onClick={(e) => { e.stopPropagation(); setSelectedServiceId(service.id); }}
                            className="p-1.5 hover:bg-vepagos-green/10 rounded text-gray-400 hover:text-vepagos-green transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          <button 
                            title="Forzar Comprobación"
                            onClick={(e) => handlePing(service.id, e)}
                            disabled={pingingService === service.id}
                            className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                          >
                            <RotateCw className={`w-4 h-4 ${pingingService === service.id ? 'animate-spin' : ''}`} />
                          </button>

                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setOpenDropdownId(openDropdownId === service.id ? null : service.id)}
                              className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openDropdownId === service.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-[var(--radius-card)] shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="py-1">
                                  <button 
                                    onClick={(e) => handleToggleMaintenance(service, e)}
                                    disabled={togglingMaintenance === service.id}
                                    className="flex items-center w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  >
                                    {togglingMaintenance === service.id ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-2 text-amber-500 animate-spin" />
                                    ) : (
                                      <PauseCircle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                    )}
                                    {isMaintenance ? 'Quitar Mantenimiento' : 'Modo Mantenimiento'}
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openHistoryModal(service.id); }}
                                    className="flex items-center w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <History className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                    Historial de Eventos
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openConfigModal(service); }}
                                    className="flex items-center w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Settings className="w-3.5 h-3.5 mr-2 text-gray-500" />
                                    Configurar Umbrales
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Telemetría */}
      {selectedServiceForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
          <Card className="w-full max-w-3xl bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh] rounded-[var(--radius-card)]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${selectedServiceForModal.status === 'up' ? 'bg-vepagos-green' : 'bg-red-500 animate-pulse'}`}></div>
                <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                  {selectedServiceForModal.name} <span className="text-gray-400 font-normal ml-2">[{selectedServiceForModal.id}]</span>
                </h2>
              </div>
              <button onClick={() => setSelectedServiceId(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white rounded-full border border-gray-200 shadow-sm">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 bg-white">
              <div className="flex justify-between items-center bg-white p-4 rounded-[var(--radius-card)] border border-gray-100 shadow-sm">
                 <div className="text-center flex-1">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Estado Actual</div>
                    <div className={`text-sm font-bold uppercase px-3 py-1 rounded-full inline-block ${selectedServiceForModal.status === 'up' ? 'bg-green-50 text-vepagos-green' : 'bg-red-50 text-red-500'}`}>
                      {selectedServiceForModal.status === 'up' ? 'Operativo' : 'Caído'}
                    </div>
                 </div>
                 <div className="border-r border-gray-100 h-12"></div>
                 <div className="text-center flex-1">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Latencia</div>
                    <div className="text-lg font-bold text-vepagos-navy">{selectedServiceForModal.latencyMs || 'N/A'} <span className="text-xs text-gray-500 font-normal">ms</span></div>
                 </div>
                 <div className="border-r border-gray-100 h-12"></div>
                 <div className="text-center flex-1">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Disponibilidad 24h</div>
                    <div className="text-lg font-bold text-vepagos-green">100.00%</div>
                 </div>
              </div>
              
              <div className="border border-gray-100 rounded-[var(--radius-card)] overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wider flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-vepagos-green" />
                    ECG de Latencia (Histórico)
                  </h3>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Última Hora</div>
                </div>
                <div className="h-56 bg-white pt-6 pb-2 px-4 flex items-center justify-center text-gray-400 text-sm relative">
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  {selectedServiceForModal.history && selectedServiceForModal.history.length > 0 ? (
                    <LineChart
                      className="h-full w-full mt-2 relative z-10"
                      data={selectedServiceForModal.history}
                      index="time"
                      categories={["Ping"]}
                      colors={[selectedServiceForModal.status === 'up' ? 'emerald' : 'red']}
                      showLegend={false}
                      showYAxis={false}
                      showXAxis={true}
                      showGridLines={false}
                      showAnimation={true}
                      curveType="monotone"
                      autoMinValue={false}
                      minValue={0}
                      yAxisWidth={40}
                      customTooltip={({ payload, active }: any) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const isDown = selectedServiceForModal.status !== 'up';
                        return (
                          <div className="bg-gray-900 border border-gray-800 p-2 rounded shadow-xl text-white text-xs font-mono">
                            {payload[0].payload.time}: <span className={isDown ? "text-red-500" : "text-vepagos-green"}>{payload[0].value} ms</span>
                          </div>
                        );
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Activity className="w-8 h-8 text-gray-200 mb-2" />
                      <span>Sin datos de telemetría recientes</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
               <button 
                  onClick={() => setSelectedServiceId(null)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                 Cerrar
               </button>
               <button 
                  className="px-4 py-2 bg-vepagos-navy text-white rounded text-xs font-bold hover:bg-vepagos-navy/90 transition-colors flex items-center disabled:opacity-75"
                  disabled={pingingService === selectedServiceForModal.id}
                  onClick={(e) => {
                    const btnId = selectedServiceForModal.id;
                    handlePing(btnId, e);
                  }}
                >
                 <RotateCw className={`w-3.5 h-3.5 mr-2 ${pingingService === selectedServiceForModal.id ? 'animate-spin' : ''}`} /> 
                 {pingingService === selectedServiceForModal.id ? 'Diagnosticando...' : 'Forzar Diagnóstico'}
               </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Historial */}
      {historyModalServiceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl flex flex-col max-h-[80vh] rounded-[var(--radius-card)]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                <History className="w-5 h-5 mr-2 text-gray-400" />
                Historial de Eventos
              </h2>
              <button onClick={() => setHistoryModalServiceId(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white rounded-full border border-gray-200 shadow-sm">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-white relative">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No se encontraron incidentes registrados para este servicio.</div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                  {historyData.map((incident: any, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-white ${incident.status === 'RESUELTA' ? 'bg-vepagos-green' : 'bg-red-500 animate-pulse'}`}></div>
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-sm uppercase ${incident.status === 'RESUELTA' ? 'bg-green-100 text-vepagos-green' : 'bg-red-100 text-red-500'}`}>
                            {incident.status}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            {new Date(incident.triggered_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-vepagos-navy mb-1">{incident.incident_type}</p>
                        <p className="text-xs text-gray-500">{incident.summary}</p>
                        {incident.resolved_at && (
                          <p className="text-[10px] mt-2 text-gray-400 font-bold uppercase">
                            Resuelto en: {Math.floor(incident.duration_seconds / 60)} min {incident.duration_seconds % 60} seg
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
               <button 
                  onClick={() => setHistoryModalServiceId(null)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                 Cerrar
               </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Umbrales */}
      {configModalService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl flex flex-col rounded-[var(--radius-card)]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-400" />
                Configurar Umbrales
              </h2>
              <button onClick={() => setConfigModalService(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white rounded-full border border-gray-200 shadow-sm">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 bg-white">
              <p className="text-sm text-gray-500">
                Ajusta la sensibilidad de monitoreo para <strong className="text-vepagos-navy">{configModalService.name}</strong> y mitiga falsas alarmas.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-vepagos-navy uppercase tracking-widest flex justify-between">
                    <span>Intervalo de Comprobación</span>
                    <span className="text-vepagos-green">{configInterval} seg</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Frecuencia con la que se hace ping al servicio.</p>
                  <input 
                    type="range" min="20" max="300" step="10" 
                    value={configInterval} 
                    onChange={(e) => setConfigInterval(parseInt(e.target.value))}
                    className="w-full accent-vepagos-green"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-vepagos-navy uppercase tracking-widest flex justify-between">
                    <span>Límite de Reintentos</span>
                    <span className="text-amber-500">{configRetries} reintentos</span>
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Reintentos fallidos requeridos antes de declarar el servicio caído.</p>
                  <input 
                    type="range" min="0" max="10" step="1" 
                    value={configRetries} 
                    onChange={(e) => setConfigRetries(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
               <button 
                  onClick={() => setConfigModalService(null)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                 Cancelar
               </button>
               <button 
                  onClick={saveConfig}
                  disabled={configSaving}
                  className="px-4 py-2 bg-vepagos-green text-white rounded text-xs font-bold hover:bg-vepagos-green/90 transition-colors flex items-center disabled:opacity-75"
                >
                 {configSaving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                 Guardar Cambios
               </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
